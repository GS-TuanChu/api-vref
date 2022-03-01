const helper = require('../helper');
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node')
const NodeCampaign = require('../helper/NodeCampaign')

let publicFunction = {
}

let cloudFunction = [{
	name: 'campaign:create',
	fields: {
		name: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_NAME"
		},
		description: {
			type: String
		},
		website: {
			type: String
		},
		contact: {
			type: String
		},
		startDate: {
			required: true
		},
		amount: {
			required: true,
			type: Number,
			options: val => {
				return val>0
			},
			error: "INVALID_AMOUNT"
		},
		commission: {
			required: true,
			type: Number,
			options: val => {
				return val>0
			},
			error: "INVALID_COMMISSION"
		},
		type: {
			type: Number
		},
		product: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_NAME"
		},
		mine: {
			required: true,
			type: Boolean,
			error: "INVALID_MINE"
		}
	},
	async run(req) {
		let { name, startDate, endDate, description, amount, commission, type, product, network, mine } = req.params;

		const Campaign = Parse.Object.extend("Campaign");
		let campaign = new Campaign();
		campaign.set("name", name);
		campaign.set("type", type);
		campaign.set("user", req.user);
		campaign.set("description", description);
		campaign.set("startDate", new Date(startDate));
		campaign.set("endDate", new Date(endDate));
		campaign.set("amount", amount);
		campaign.set("amountToken", 0); // ********
		campaign.set("commission", commission);
		campaign.set("mine", !!mine);
		campaign.set("product", helper.createObject("Product", product));
		campaign.set("website", website);
		campaign.set("contact", contact);

		let rootNode = null;
		if ( network ) { // have a root node
			rootNode = await Node.get(network)
			if ( rootNode ) campaign.set("rootNode", rootNode);
		}

		await campaign.save(null,{ sessionToken: req.user.getSessionToken() });
		// create root node
		if ( !rootNode ) {
			rootNode = await Node.createNode({
				params: {
					campaign: campaign.id
				},
				user: req.user,
			}, true)
			campaign.set("rootNode", rootNode);
		}
		return campaign.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id })).catch(e => {
			console.log('campaign:create', e)
		});
	}
}, {
	name: 'campaign:createTx',
	fields: {
		cid: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) { // only the author can create transaction
		return Camp.createTransaction(req);
	}
}, {
	name: 'campaign:following',
	fields: {
	},
	async run(req) {
		let { count } = req.params;

		let nodes = await NodeCampaign.following(req.user)
		let campaignIds = nodes ? nodes.map(n => n.get('campaign').id) : []

		if ( count ) return { count: campaignIds.length }

		// add paging ****
		return nodes.map(n => n.get("campaign")).map(c => ({
			id: c.id,
			name: c.get('name'),
			description: c.get('description'),
			active: c.get('active'),
			createdAt: c.get('createdAt').toISOString()
		}))
	}
}, {
	name: 'campaign:mine',
	fields: {
	},
	async run(req) {
		// add paging ****
		let campQuery = new Parse.Query("Campaign");
		campQuery.equalTo("user", req.user);
		campQuery.descending("createdAt");
		let campaigns = await campQuery.find({ sessionToken: req.user.getSessionToken() });
		return campaigns.map(c => ({
			id: c.id,
			name: c.get('name'),
			description: c.get('description'),
			active: c.get('active'),
			createdAt: c.get('createdAt').toISOString()
		}))
	}
}, {
	name: 'campaign:leave',
	fields: {
		cid: {
			required: true,
			type: String,
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
		let nodeCamp = NodeCampaign.get(req.user, helper.createObject("Campaign", req.params.cid));
		if ( !nodeCamp ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));
		nodeCamp.set("active", false);
		return nodeCamp.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ status: true }));
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
