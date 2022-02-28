const helper = require('../helper');

module.exports = {
	async get(user, campaign) {
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", user);
		query.equalTo("campaign", campaign);
		return query.first({ useMasterKey: true }).catch(e => false);
	},
	async assign(node, campaign, user) {
		const NodeCampaign = Parse.Object.extend("NodeCampaign");
		let nc = new NodeCampaign();
		nc.set("node", node);
		nc.set("campaign", campaign);
		nc.set("user", user);

		return nc.save(null,{ sessionToken: user.getSessionToken() });
	},
	async following(user) {
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", user);
		query.include("campaign");
		return query.find({ sessionToken: user.getSessionToken() }).catch(e => false);
	},
	async topSeller(cid, limit=10) {
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
	}
}
