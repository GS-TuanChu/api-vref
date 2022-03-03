const helper = require('../helper');

let publicFunction = {
	
}

let cloudFunction = [{
	name: 'network:get',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query("NodeCampaign");
		query.equalTo("user", req.user);
		query.ascending("createdAt");
		query.include("node");
		query.include("campaign");
		let campaigns = await query.find({ sessionToken: req.user.getSessionToken() });
		let networks = [];
		let rootNodes = {};
		for ( let campaign of campaigns ) {
			if ( !campaign.get("node") || !campaign.get("campaign") || !campaign.get("node").get("active") ) continue;
			let rootNode = campaign.get("node").get("ref") ? campaign.get("node").get("ref")[0] : campaign.get("node").id;
			if ( rootNodes[rootNode] ) {
				rootNodes[rootNode]++;
				continue;
			}
			
			rootNodes[rootNode] = 1;
			let name = campaign.get("node").get("metadata") ? campaign.get("node").get("metadata").name : "";
			if ( !name ) {
				name = campaign.get("campaign").get("name")
			}
			
			networks.push({
				node: campaign.get("node").id,
				rootNode,
				name
			})
		}
		for ( let i=0; i<networks.length; i++ ) {
			networks[i].countCampaign = rootNodes[networks[i].rootNode];
		}
		return networks;
	}
}, {
	name: 'network:update',
	fields: {
		id: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_ID"
		}
	},
	async run(req) {
		let query = new Parse.Query("Node");
		let node = await query.get(req.params.id, { sessionToken: req.user.getSessionToken() });
		if ( req.user.id==node.get("user").id ) {
			let metadata = node.get("metadata") || {};
			if ( req.params.name && typeof req.params.name == "string" ) {
				metadata.name = req.params.name;
				node.set("metadata", metadata);
			}
			if ( req.params.hasOwnProperty("active") ) {
				node.set("active", !!req.params.active);
			}
			await node.save(null, { useMasterKey: true });
		}
		return { status: true }
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
