const helper = require('../helper');
const Camp = require('../helper/Campaign')

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
		maxProduct: {
			required: true,
			type: Number,
			options: val => {
				return val>0
			},
			error: "INVALID_PRODUCT"
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
		}
	},
	async run(req) {
		let { name, startDate, endDate, description, amount, maxProduct, type, product } = req.params;

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
		campaign.set("maxProduct", maxProduct);
		campaign.set("product", helper.createObject("Product", product));

		return campaign.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
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
	async run(req) {
		let { cid } = req.params;

		let campaign = Camp.validCampaign(cid)
		if ( !campaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		// check user permission

		let now = helper.now()
		let message = [cid, now, req.user.id].join(',')
		let encrypted = helper.encrypt(message)

		return {
			content: `trans:${cid}:${encrypted.iv}|${encrypted.content}`
		};
	}
}, {
	name: 'campaign:following',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query("Node");
		query.equalTo("user", req.user);
		let nodes = await query.find({ sessionToken: req.user.getSessionToken() });
		let campaignIds = nodes ? nodes.map(n => n.get('campaign').id) : []

		// add paging ****
		let campQuery = new Parse.Query("Campaign");
		campQuery.containedIn("objectId", campaignIds);
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
}]

module.exports = {
	publicFunction, cloudFunction
}
