const Campaign = require('./Campaign');
const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("Node");
		return query.get(id, { useMasterKey: true });
	},
	async getFromUid(uid, cid) {
		let query = new Parse.Query("Node");
		query.equalTo("user", helper.createObject(Parse.User, uid));
		query.equalTo("campaign", helper.createObject("Campaign", cid));
		return query.first({ useMasterKey: true });
	},
	async createNode(req) {
		let { ref, campaign } = req.params;
		
		// check campaign exists or still available
		let campaignRef = await Campaign.get(campaign)
		if ( !campaignRef || !campaignRef.get('active') ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		// check node ref still available
		let nodeRef = await this.get(ref)
		if ( !nodeRef || !nodeRef.get('active') ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_REF"));

		const Node = Parse.Object.extend("Node");
		let node = new Node();
		node.set("ref", nodeRef);
		node.set("user", req.user);
		node.set("campaign", campaignRef);
		node.set("active", true);

		return node.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}
