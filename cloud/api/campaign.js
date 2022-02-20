
const Camp = require('../helper/Campaign')

let publicFunction = {
}

let cloudFunction = [{
	name: 'api:campaign:createTx',
	fields: {
		cid: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CAMPAIGN"
		},
		txid: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_TXID"
		}
	},
	async run(req) { // only the author can create transaction
		return Camp.createTransaction(req);
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
