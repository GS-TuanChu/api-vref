const Campaign = require('./Campaign');
const NodeCampaign = require('./NodeCampaign');
const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("Node");
		return query.get(id, { useMasterKey: true }).catch(e => false);
	},
	async getUserJoinedNode(user, campaign) {
		let nodeCampaign = await NodeCampaign.get(user, campaign)
		if ( nodeCampaign ) return nodeCampaign.get("node");

		if ( !isNaN(campaign) )
			campaign = Campaign.get(campaign)
		// if ( !campaign ) return false; // checked ?
		if ( !campaign || !campaign.get("rootNode") ) return false;
		let campaignNode = campaign.get("rootNode").id;

		let allNodes = []
		let query = new Parse.Query("Node");
		query.equalTo("user", user);
		let nodes = await query.find({ useMasterKey: true });
		if ( nodes )
			for ( let node of nodes ) {
				if ( node.get("ref") && node.get("ref").indexOf(campaignNode)!=-1 ) return node;
			}
		return false;
	},
	async nodeCode(user, campaign) {
		let node = await this.getUserJoinedNode(user, campaign);
		let joined = !!node;
		if ( !node ) node = campaign.get("rootNode");

		return {
			joined,
			code: `node:${campaign.id}:${node.id}`
		}
	},
	async createNode(req, ignoreActive=false) {
		let { ref, campaign } = req.params;

		// check campaign exists or still available
		let campaignRef = await Campaign.get(campaign)
		if ( !campaignRef || ((!campaignRef.get('active') || ignoreActive) && campaignRef.get('user').id!=req.user.id) ) 
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		// check user already join network
		let myNode = await this.getUserJoinedNode(req.user, campaignRef)
		if ( myNode ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "ALREADY_JOINED"));

		const Node = Parse.Object.extend("Node");
		let node = new Node();
		node.set("user", req.user);
		node.set("active", true);

		// check node ref still available
		let parentNode = ref ? (await this.get(ref)) : null;
		if ( parentNode ) {
			let chain = parentNode.get("ref") || []
			chain.push(parentNode.id)
			node.set("ref", chain);

			let users = parentNode.get("refUser") || []
			users.push(parentNode.get("user").id)
			node.set("refUser", users);

			node.set("parent", helper.createObject("Node", ref));
		}

		await node.save(null,{ sessionToken: req.user.getSessionToken() });
		await NodeCampaign.assign(node, campaignRef, req.user);

		return node;
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
	}
}
