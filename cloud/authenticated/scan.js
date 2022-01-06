const Transaction = require('../helper/Transaction');
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
		let [type, cid, txid] = req.params.code.split(":")
		switch (type) {
			case 'trans':
				return Transaction.createTransaction({
					params: {
						cid, txid
					},
					user: req.user
				})
				break;
			case 'node':
				return Node.createNode({
					params: {
						ref: txid,
						campaign: cid
					},
					user: req.user
				})
				break;
		}
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
