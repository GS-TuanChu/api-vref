const helper = require('../helper');
const Node = require('../helper/Node');

let publicFunction = {
}

let cloudFunction = [{
	name: 'node:create',
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
		return Node.createNode(req)
	}
}] // node:create , node:transfer - transfer this node to another account , node - delete --> system will takecare of this account

module.exports = {
	publicFunction, cloudFunction
}
