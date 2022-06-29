const helper = require('../helper');
const NodeCamp = require('../helper/NodeCampaign');

let publicFunction = {

}

let cloudFunction = [
	{
		name: 'admin:upgrade',
		fields: {
		},
		async run(req) {
			let query = new Parse.Query("TokenTransaction");
			query.ascending("createdAt");
			query.limit(500);
			query.include("node");
			query.include("campaign");
			let txs = await query.find({ sessionToken: req.user.getSessionToken() });
			txs = txs.filter(tx => tx.get("campaign") && tx.get("node"));
			for ( let tx of txs ) {
				const WalletTransaction = Parse.Object.extend("WalletTransaction");
				let newTx = new WalletTransaction();
				newTx.set("user", tx.get("user"));
				newTx.set("currency", helper.createObject("Currency", "UyOZMa1MbQ"));
				newTx.set("amount", tx.get("amount").toString());
				newTx.set("metadata", tx.get("metadata"));
				newTx.set("tx", tx.get("tx"));
				newTx.set("node", tx.get("node"));
				newTx.set("campaign", tx.get("campaign"));
				await newTx.save(null, {useMasterKey: true});
				await helper.sleep(100);
			}
			return { length: txs.length }
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}