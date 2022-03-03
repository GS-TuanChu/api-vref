const helper = require('../helper');
const NodeCampaign = require('../helper/NodeCampaign');
const Node = require('../helper/Node');

let publicFunction = {
}

let cloudFunction = [{
	name: 'node:map',
	fields: {
		cid: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_NODE"
		}
	},
	async run(req) {
		let { cid } = req.params;
		let nodeCampaign = await NodeCampaign.get(req.user, cid)
		console.log({nodeCampaign})
		if ( !nodeCampaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		let [upLevel, downLevel] = await Promise.all([
			Node.getNodes('up', nodeCampaign.get("node").id), 
			Node.getNodes('down', nodeCampaign.get("node").id)
		])
		return {
			upLevel, downLevel
		}
	}
}] // node:create , node:transfer - transfer this node to another account , node - delete --> system will takecare of this account

module.exports = {
	publicFunction, cloudFunction
}
