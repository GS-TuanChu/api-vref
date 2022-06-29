const Transaction = require('../helper/Transaction');
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node');
const NodeCamp = require('../helper/NodeCampaign');
const config = require('../config');

let publicFunction = {}

let cloudFunction = [{
	name: 'scan:qrcode',
	fields: {
		code: {
			required: true,
			type: String,
			options: val => { // http://viref.net/scan/
				val = val.split(config.scanUrl).pop();
				let type = val.split(":")[0]
				let types = ["trans", "node"]
				return val.length>5 && types.indexOf(type)>-1;
			},
			error: "INVALID_CODE"
		}
	},
	async run(req) {
		// if ( !req.user.get("phone") ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "ACTIVE_PHONE_REQUIRED"));
		
		let code = req.params.code.split(config.scanUrl).pop();
		let [type, cid, txid] = code.split(":")
		let campaign = await Camp.validCampaign(cid)
		if ( !campaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		if ( req.params.preview ) {
			return {
				campaign: {
					id: campaign.id,
					name: campaign.get("name"),
					type: campaign.get("type"),
					description: campaign.get("description"),
					active: campaign.get("active"),
					amount: campaign.get("amount"),
					product: {
						media: campaign.get("product").get("media"),
						website: campaign.get("product").get("website")
					}
				}
			}
		}

		switch (type) {
			case 'trans':
				let nodeCamp = await NodeCamp.get(req.user, campaign); // already filter active
				let nodeRef = null;
				if ( !nodeCamp ) {
					nodeRef = await Node.createNode({
						params: {
							ref: campaign.get("rootNode").id,
							campaign: cid
						},
						user: req.user
					});
					nodeCamp = await NodeCamp.assign(nodeRef, campaign, req.user);
				}
				nodeRef = nodeCamp.get("node");
				console.log('scan:qrcode', { nodeRef })

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
