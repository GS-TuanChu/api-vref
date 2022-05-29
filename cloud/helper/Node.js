const Campaign = require('./Campaign');
const NodeCampaign = require('./NodeCampaign');
const helper = require('../helper');
const config = require('../config');

module.exports = {
	async get(id) {
		if ( !id ) return null;
		let query = new Parse.Query("Node");
		return query.get(id, { useMasterKey: true }).catch(e => false);
	},
	async nodeCode(user, campaign) {
		let nodeCamp = await NodeCampaign.get(user, campaign, false); // if nodeCamp is not active, it's still ok, other people still can join
		let joined = !!nodeCamp && nodeCamp.get("node")  && nodeCamp.get("active") && nodeCamp.get("node").get("active");
		let node = joined ? nodeCamp.get("node") : null;
		if ( !node ) node = campaign.get("rootNode");

		return {
			joined,
			code: `${config.scanUrl}node:${campaign.id}:${node.id}`
		}
	},
	async createNode(req, ignoreActive=false) {
		let { ref, campaign } = req.params;

		// check campaign exists or still available
		let campaignRef = await Campaign.get(campaign)
		if ( !campaignRef || ((!campaignRef.get('active') || ignoreActive) && campaignRef.get('user').id!=req.user.id) ) { // allow campaign creator create root node when campaign is not active yet
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));
		}

		// check user already join network *******
		let myNodeCamp = await NodeCampaign.get(req.user, campaignRef, false)
		if ( myNodeCamp ) {
			if ( myNodeCamp.get("active")==false ) {
				myNodeCamp.set("active", true);
				return myNodeCamp.save(null, { useMasterKey: true });
			}
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "ALREADY_JOINED"));
		}

		const Node = Parse.Object.extend("Node");
		let node = new Node();
		node.set("user", req.user);
		node.set("active", true);

		// check node ref still available
		let parentNode = await this.get(ref);
		if ( parentNode ) {
			let chain = parentNode.get("ref") || []
			chain.push(parentNode.id)
			node.set("ref", chain);

			let users = parentNode.get("refUser") || []
			users.push(parentNode.get("user").id)
			node.set("refUser", users);

			node.set("parent", helper.createObject("Node", ref));
		}

		let nodeCamp = await NodeCampaign.assign(node, campaignRef, req.user); // NodeCampaign.assign will save the node also

		return nodeCamp.get("node");
	},
	async getNodes(direction, nodeId) {
		let query = new Parse.Query("Node");
		query.include("user");

		function extractInfo(node) {
			return node ? {
				id: node.id,
				uid: node.get('user').id,
				fullname: node.get('user').get('fullname'),
				username: node.get('user').get('username'),
				avatar: node.get('user').get('avatar'),
				phone: node.get('user').get('phone')
			} : null;
		}

		switch(direction) {
			case 'up':
				let node = await this.get(nodeId)
				if ( !node || node.get('parent')==null ) return null;
				return query.get(node.get('parent').id, { useMasterKey: true }).then(node => extractInfo(node));
				break;
			case 'down':
				query.equalTo("parent", helper.createObject("Node", nodeId));
				return query.find({ useMasterKey: true }).then(nodes => nodes.map(node => extractInfo(node)));
				break;
		}
	},
  async getRefUsers(camDetail) {
    let nodeCamp = await NodeCampaign.getNodes(camDetail)
    const refUsers = []
    let uids = [...nodeCamp.flat()]
    uids = uids.filter((item, i, arr) => arr.indexOf(item) === i)
    let userQuery = new Parse.Query('User')
    userQuery.containedIn('objectId', uids)
    let users = await userQuery.find({ useMasterKey: true })
    const map = new Map()
    users.forEach((user) => {
        map.set(user.id, user.get('fullname'))
    })
    for (let uids of nodeCamp) {
        let users = []
        for (let uid of uids) {
            let name = map.get(uid)
            const u = {
              id: uid,
              name
            }
            users.push(u)
        }
        refUsers.push(users)
    }
    return refUsers
  }
}
