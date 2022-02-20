
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
		let TxQuery = new Parse.Query("TokenTransaction");
		TxQuery.equalTo("user", req.user);
		TxQuery.descending("createdAt");
		TxQuery.include("tx.campaign"); // get campaign info
		console.log("user", req.user)
		let trans = await TxQuery.find({ sessionToken: req.user.getSessionToken() });
		console.log("trans", trans)
		return trans.map(t => ({
			amount: t.get('amount'),
			amountToken: t.get('amountToken'),
			createdAt: t.get('createdAt').toISOString(),
			id: t.id,
			campaign: {
				name: t.get('tx').get('campaign').get('name'),
				id: t.get('tx').get('campaign').id
			}
		}))
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
