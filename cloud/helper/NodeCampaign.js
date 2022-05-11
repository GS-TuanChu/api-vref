const helper = require('../helper');
const Campaign = require('./Campaign');

module.exports = {
	async get(user, campaign, filterActive=true) {
		if ( typeof campaign == "string" || !campaign.get("rootNode") ) {
			try {
				let campaignId = typeof campaign == "string" ? campaign : campaign.id;
				campaign = await Campaign.get(campaignId);
			} catch(e) {
				console.log("NodeCampaign get error", e)
			}
		}
		if ( !campaign.get("rootNode") ) return null;

		// Get NodeCampaign record
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", user);
		query.equalTo("campaign", campaign);
		query.include("node");
		if ( filterActive ) {
			query.equalTo("active", true);
		}
		let nodeCamp = await query.first({ useMasterKey: true }).catch(e => false);
		if ( nodeCamp ) {
			if (!filterActive || nodeCamp.get("node").get("active"))
				return nodeCamp;
			else return null;
		}

		// if nodeCamp doesn't exists, check if user already in network, if yes, create NodeCampaign
		let rootNode = campaign.get("rootNode").id;
		let foundNode = null;

		// if I own rootNode
		let queryNode1 = new Parse.Query("Node");
		let node = await queryNode1.get(rootNode, { useMasterKey: true });
		if ( node && node.get("user").id==user.id ) foundNode = node;
		else {
			let queryNode = new Parse.Query("Node");
			queryNode.equalTo("user", user);
			queryNode.equalTo("ref", rootNode);
			foundNode = await queryNode.first({ useMasterKey: true })
		}
		if ( foundNode ) {
			return this.assign(foundNode, campaign, user, false);
		}

		return null;
	},
	async assign(node, campaign, user, reActive=true) {
		// check exists first
		console.log({user})
		let userToken = helper.getUserToken(user);
		console.log({userToken})
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", user);
		query.equalTo("campaign", campaign);
		query.include("node");
		let nodeCamp = await query.first(userToken).catch(e => false);
		if ( nodeCamp ) { // if exists, check active
			if ( reActive && nodeCamp.get("active")==false ) {
				nodeCamp.set("active", true);
				await nodeCamp.save(null, userToken)
			}
			let oldNode = nodeCamp.get("node");
			if ( reActive && oldNode.get("active")==false ) {
				oldNode.set("active", true);
				await oldNode.save(null, userToken)
			}
			return nodeCamp
		}

		if ( !node.id ) { // sometime node is not saved yet
			await node.save(null, userToken)
		}
		const NodeCampaign = Parse.Object.extend("NodeCampaign");
		let nc = new NodeCampaign();
		nc.set("node", node);
		nc.set("campaign", campaign);
		nc.set("user", user);

		return nc.save(null, userToken);
	},
	async following(user) {
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", user);
		query.include("campaign");
		query.include("campaign.product");
		query.include("campaign.currency");
		return query.find({ sessionToken: user.getSessionToken() }).catch(e => false);
	},
	async topSeller(cid, limit=10) { // remove root node
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("campaign", helper.createObject("Campaign", cid));
		query.include("user");
		query.descending("sold");
		query.limit(limit);
		return query.find({ useMasterKey: true }).catch(e => false);
	},
	async topReferer(cid, limit=10) {
		let cQuery = new Parse.Query("Campaign");
		let campaign = await cQuery.get(cid, { useMasterKey: true });

		let query = new Parse.Query("Node");
		query.equalTo("ref", campaign.get("rootNode").id);
		query.include("user");
		// query.lessThan("node.child", 0)
		// query.select("node.child");
		query.descending("child");
		query.limit(limit);

		let topReferer = await query.find({ useMasterKey: true }).catch(e => {
			console.log("topReferer error", e)
			return false;
		});
		topReferer = topReferer.filter(tr => tr.get("child"))
		topReferer.sort(function(item1, item2) {
			let x = item1.get("child");
			let y = item2.get("child");
			return x<y ? 1 : -1;
		});
		return topReferer
	},
	async getNodes(campaign) {
		if ( typeof campaign == "string" || !campaign.get("rootNode") ) {
			try {
				let campaignId = typeof campaign == "string" ? campaign : campaign.id;
				campaign = await Campaign.get(campaignId);
			} catch(e) {
				console.log("NodeCampaign get error", e)
			}
		}
		if ( !campaign.get("rootNode") ) return null;

		// Get NodeCampaign record
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("campaign", campaign);
		query.include("node");
		
		let nodeCamps = await query.find({ useMasterKey: true }).catch(e => {
			console.log("getNodes error", e)
			return false
		})
		let nodes = nodeCamps.map(n => n.get("node").get("refUser"))
		return nodes.filter(n => n != null && n.length > 1)
	}
}
