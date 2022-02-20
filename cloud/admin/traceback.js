const Schema = require('../schema');
const helper = require('../helper');
const Camp = require('../helper/Campaign');
const Node = require('../helper/Node');
const NodeCampaign = require('../helper/NodeCampaign');

let publicFunction = {

}

let cloudFunction = [
	{
		name: 'traceback:trans',
		fields: {
			id: {
				required: true,
				type: String,
				options: val => { // verify email
					return val.length>5
				},
				error: "INVALID_ID"
			}
		},
		async run(req) {
			let query = new Parse.Query("Transaction");
			query.include("campaign");
			query.include("node");
			let tx = await query.get(req.params.id, { sessionToken: req.user.getSessionToken() });
			let campaign = tx.get("campaign");
			let node = tx.get("node");

			let queryToken = new Parse.Query("TokenTransaction");
			queryToken.equalTo("tx", tx);
			queryToken.include("user");
			let txMoney = await queryToken.find({ sessionToken: req.user.getSessionToken() }).catch(e => false);

			const users = await (new Parse.Query(Parse.User)).containedIn('objectId', node.get("refUser")).find({ useMasterKey: true });

			return {
				id: tx.id,
				campaign: {
					id: campaign.id,
					name: campaign.get("name")
				},
				node: {
					id: node.id,
					ref: node.get("ref"),
					refUser: node.get("refUser"),
					users: users.map(u => ({
						id: u.id,
						username: u.get("username")
					}))
				},
				transMoney: txMoney.map(tx => ({
					user: {
						id: tx.get("user").id,
						username: tx.get("user").get("username")
					},
					amount: tx.get("amount"),
					metadata: tx.get("metadata"),
					campaign: tx.get("campaign").id
				}))
			}

			
		}
	}, 
	{
		name: 'traceback:campaign',
		fields: {
			id: {
				required: true,
				type: String,
				options: val => { // verify email
					return val.length>5
				},
				error: "INVALID_ID"
			}
		},
		async run(req) {
			let campaign = await Camp.get(req.params.id);
			let rootNode = await Node.get(campaign.get("rootNode").id);
			let downLevel = await Node.getNodes('down', rootNode.id);
			for ( let node of downLevel ) {
				let detail = await NodeCampaign.get(helper.createObject(Parse.User, node.uid), campaign);
				node.bought = detail.get("bought");
				node.networkBought = detail.get("networkBought");
				if ( node.networkBought>0 ) {
					node.childrens = await Node.getNodes('down', node.id);
				}
			}

			return {
				campaign: {
					id: campaign.id,
					name: campaign.get("name")
				},
				node: {
					id: rootNode.id,
					bought: rootNode.get("bought"),
					networkBought: rootNode.get("networkBought"),
					childrens: downLevel
				}
			}
			
		}
	}, 
	{
		name: 'traceback:count',
		fields: {
		},
		async run(req) {
			let countUser = await (new Parse.Query(Parse.User)).count({ useMasterKey: true }); // VLgVF5pJgC
			let query = new Parse.Query("NodeCampaign");
			query.equalTo("campaign", helper.createObject("Campaign", "8rKCtS6WHv"));
			let countCampaign = await query.count({ useMasterKey: true }).catch(e => false);

			return {
				countUser,
				countCampaign
			}
			
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}