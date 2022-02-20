const Transaction = require('../helper/Transaction');
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node');

let publicFunction = {}

let cloudFunction = [{
	name: 'scan:qrcode',
	fields: {
		code: {
			required: true,
			type: String,
			options: val => {
				let type = val.split(":")[0]
				let types = ["trans", "node"]
				return val.length>5 && types.indexOf(type)>-1;
			},
			error: "INVALID_CODE"
		}
	},
	async run(req) {
		if ( !req.user.get("phone") ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "ACTIVE_PHONE_REQUIRED"));
		
		let [type, cid, txid] = req.params.code.split(":")
		let campaign = await Camp.validCampaign(cid)
		if ( !campaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		switch (type) {
			case 'trans':
				let nodeRef = await Node.getUserJoinedNode(req.user, campaign);
				if ( !nodeRef ) {
					nodeRef = await Node.createNode({
						params: {
							ref: campaign.get("rootNode").id,
							campaign: cid
						},
						user: req.user
					})
				}

				return Transaction.createTransaction({
					params: {
						cid, txid, nodeRef
					},
					user: req.user
				}).then(trans => {
					if ( trans.id ) {
						return {
							status: true,
							campaign: campaign.get("name")
						}
					}
				})
				
			case 'node':
				return Node.createNode({
					params: {
						ref: txid,
						campaign: cid
					},
					user: req.user
				}).then(res => ({ status: true, id: res.id, campaign: campaign.get("name") }))
				break;
		}
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
