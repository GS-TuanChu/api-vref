const helper = require('../helper');

let publicFunction = {

}

let cloudFunction = [{
	name: 'tokenTx:create',
	fields: {
		ref: {
			required: true,
			type: String,
			options: val => {
				return val.length>0
			},
			error: "INVALID_REF"
		},
		campaign: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
		return publicFunction.createNode(req)
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
