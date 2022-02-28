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
			// var query = new Parse.Query("NodeCampaign");
			// query.doesNotExist("sold");
			// query.limit(500);
			// return query.find({ useMasterKey: true }).then((results) => {
			// 	if ( results.length==0 ) return {count: results.length}
			// 	for (var i = 0; i < results.length; i++) {
			//         var item = results[i];
			//         item.set("sold", 0);
			//     }
			//     return Parse.Object.saveAll(results, { useMasterKey: true }).then(() => {
			//     	return {count: results.length}
			//     });
			// });


			let campaign = await Camp.get(req.params.id);
			let query = new Parse.Query("Transaction");
			query.equalTo("campaign", campaign);
			query.include("node");
			query.include("node.parent");
			query.include("node.parent.user");
			query.include("user");
			const txs = await query.find({ useMasterKey: true });
			let bought = {};
			// let DBbought = {};
			for ( let tx of txs ) {
				if ( !bought[tx.get("node").id] ) bought[tx.get("node").id] = {
					bought: 0,
					parent: tx.get("node").get("parent"),
					username: tx.get("user").get("username")
				};
				bought[tx.get("node").id].bought++;
				// let detail = await NodeCampaign.get(tx.get("user"), campaign);
				// DBbought[tx.get("user").get("username")] = {
				// 	bought: detail.get("bought"),
				// 	networkBought: detail.get("networkBought"),
				// 	sold: detail.get("sold")
				// }
			}

			let parents = {};
			for ( let nodeId of Object.keys(bought) ) {
				console.log("bought[nodeId].parent", bought[nodeId].parent)
				if ( !parents[bought[nodeId].parent.id] ) parents[bought[nodeId].parent.id] = {
					user: {
						id: bought[nodeId].parent.get("user").id,
						username: bought[nodeId].parent.get("user").get("username")
					},
					sold: 0
				};
				parents[bought[nodeId].parent.id].sold += bought[nodeId].bought;
			}

			for ( let nodeId of Object.keys(bought) ) {
				let query = new Parse.Query("NodeCampaign");
				query.equalTo("node", bought[nodeId].parent);
				query.equalTo("campaign", campaign);
				query.include("user");
				const detail = await query.first({ useMasterKey: true });
				bought[nodeId].parent = {
					id: bought[nodeId].parent.id,
					sold: detail.get("sold"),
					username: detail.get("user").get("username")
				}
			}
			
			return {
				campaign: {
					id: campaign.id,
					name: campaign.get("name"),
					trans: txs.length,
					bought,
					// DBbought
				},
				sold: parents,
				trans: txs.map(tx => ({
					node: {
						id: tx.get("node").id,
						child: tx.get("node").get("child"),
						grandchild: tx.get("node").get("grandchild")
					},
					txid: tx.get("txid"),
					campaign: tx.get("campaign").id,
					user: {
						id: tx.get("user").id,
						username: tx.get("user").get("username")
					},
					id: tx.id
				}))
			};

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
	}, 
	{
		name: 'traceback:trang',
		fields: {
		},
		async run(req) {
			let query = new Parse.Query("Node");
			query.equalTo("parent", helper.createObject("Node", "k0RED5oEXY"));
			query.include("user");
			query.descending("createdAt");
			query.limit(1000);
			return query.find({ useMasterKey: true }).then(res => {
				return res.map(node => ({
					username: node.get("user").get("username"),
					phone: node.get("user").get("phone"),
					createdAt: node.get("user").get("createdAt").toISOString()
				}))
			})
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}