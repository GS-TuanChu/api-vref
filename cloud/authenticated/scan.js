const Transaction = require('../helper/Transaction');
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node');
const NodeCamp = require('../helper/NodeCampaign');

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

		if ( req.params.preview ) {
			return {
				campaign: {
					name: camDetail.get("name"),
					type: camDetail.get("type"),
					description: camDetail.get("description"),
					active: camDetail.get("active"),
					amount: camDetail.get("amount"),
					joined: rootNode.get("child")+rootNode.get("grandchild"),
					product: {
						media: camDetail.get("product").get("media"),
						website: camDetail.get("product").get("website")
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
