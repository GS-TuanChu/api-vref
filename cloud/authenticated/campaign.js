const helper = require('../helper');
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node')
const NodeCampaign = require('../helper/NodeCampaign')
const Product = require('../helper/Product')

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
		network: {
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
		type: { // 
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
		},
		// rewardType: { // 0: fixed, 1: flexible, 2: percent
		// 	required: true,
		// 	type: Number,
		// 	options: val => {
		// 		return val>=0 && val<3
		// 	},
		// 	error: "INVALID_REWARDTYPE",
		// },
		// currency: {
		// 	required: true,
		// 	type: String,
		// 	options: val => {
		// 		return val.length>5
		// 	},
		// 	error: "INVALID_CURRENCY"
		// }
	},
	async run(req) {
		let { name, startDate, endDate, description, amount, commission, type, product, network, mine, website, contact, rewardType, currency } = req.params;
		product = await Product.get(product);
		if ( product.get("user").id!=req.user.id ) {
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_USER"));
		}

		const Campaign = Parse.Object.extend("Campaign");
		let campaign = new Campaign();
		campaign.set("name", name);
		campaign.set("type", type);
		campaign.set("user", req.user);
		campaign.set("description", description);
		campaign.set("startDate", new Date(startDate));
		campaign.set("endDate", new Date(endDate));
		campaign.set("amount", amount);
		// campaign.set("amountToken", 0); // ********
		campaign.set("commission", commission);
		campaign.set("mine", !!mine);
		campaign.set("product", product);
		campaign.set("website", website);
		campaign.set("contact", contact);
		campaign.set("category", product.get("category"));
		campaign.set("rewardType", parseInt(rewardType || 0));
		campaign.set("currency", helper.createObject("Currency", currency || "UyOZMa1MbQ"));

		let rootNode = null;
		if ( network ) { // have a root node
			rootNode = await Node.get(network)
			if ( rootNode && rootNode.get("user").id==req.user.id ) campaign.set("rootNode", rootNode);
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
		nodes = nodes.filter(n => n.get("active"))
		let campaignIds = nodes.map(n => (n.get('campaign') ? n.get('campaign').id : null)).filter(n => n);

		if ( count ) return { count: campaignIds.length }

		// add paging ****
		return nodes.filter(n => n.get("campaign")).map(n => n.get("campaign")).map(c => ({
			id: c.id,
			name: c.get('name'),
			description: c.get('description'),
			active: c.get('active'),
			createdAt: c.get('createdAt').toISOString(),
			endDate: c.get('endDate').toISOString(),
			amount: c.get('amount'),
			paid: c.get('paid'),
			commission: c.get('commission'),
			rewardType: c.get('rewardType'),
			product: {
				media: c.get('product').get("media")
			},
			currency: {
				name: c.get("currency").get("name"),
				symbol: c.get("currency").get("symbol"),
				id: c.get("currency").id,
			},
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
		campQuery.include("product");
		campQuery.include("currency");
		campQuery.descending("createdAt");
		let campaigns = await campQuery.find({ sessionToken: req.user.getSessionToken() });
		return campaigns.map(c => ({
			id: c.id,
			name: c.get('name'),
			description: c.get('description'),
			active: c.get('active'),
			createdAt: c.get('createdAt').toISOString(),
			product: {
				media: c.get("product").get("media")
			},
			currency: {
				name: c.get("currency").get("name"),
				symbol: c.get("currency").get("symbol"),
				id: c.get("currency").id,
			},
			endDate: c.get('endDate').toISOString(),
			amount: c.get('amount'),
			paid: c.get('paid'),
			commission: c.get('commission'),
			rewardType: c.get('rewardType')
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
		let nodeCamp = await NodeCampaign.get(req.user, req.params.cid);
		if ( !nodeCamp ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));
		nodeCamp.set("active", false);
		return nodeCamp.save(null,{ useMasterKey: true }).then(res => ({ status: true }));
	}
}, {
	name: 'campaign:remove',
	fields: {
		cid: {
			required: true,
			type: String,
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
		let campaign = await Camp.get(req.params.cid);
		if ( !campaign || campaign.get('user').id!=req.user.id || campaign.get('user').get("active") ) return {status: false};
		await campaign.destroy({ useMasterKey: true });
		return {status: true};
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
