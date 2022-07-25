const User = require("../helper/User")
let publicFunction = {
	
}

let cloudFunction = [{
	name: 'transaction:create',
	fields: {
		name: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_NAME"
		}
	},
	async run(req) {
		
	}
}, {
	name: 'transaction:mine',
	fields: {
	},
	async run(req) {
		// add paging ****
    const { currencyId } = req.params
		let TxQuery = new Parse.Query("TokenTransaction");
		TxQuery.equalTo("user", req.user);
		TxQuery.descending("createdAt");
		TxQuery.include("tx.campaign"); // get campaign info
    if (currencyId) {
      const campQuery = new Parse.Query("Campaign")
      const currencyQuery = new Parse.Query("Currency")
      currencyQuery.equalTo("objectId", currencyId)
      campQuery.matchesQuery("currency", currencyQuery) // Query only campaigns that uses the currency
      TxQuery.matchesQuery("campaign", campQuery)
      TxQuery.include("campaign.currency")
    }
		let trans = await TxQuery.find({ useMasterKey: true });
		return trans.map(t => ({
			amount: t.get('amount'),
			amountToken: t.get('amountToken'),
			createdAt: t.get('createdAt').toISOString(),
			id: t.id,
			campaign: {
				name: t.get('tx').get('campaign').get('name'),
				id: t.get('tx').get('campaign').id
			},
      currency: {
        name: t.get('campaign').get('currency').get('name'),
        symbol: t.get('campaign').get('currency').get('symbol'),
        id: t.get('campaign').get('currency').id
      } 
		}))
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
