const config = require('../config');
const helper = require('../helper');
const Campaign = require('../helper/Campaign')
const Node = require('../helper/Node')
const NodeCampaign = require('../helper/NodeCampaign')

let publicFunction = {
}

let cloudFunction = [{
	name: 'campaign:recent',
	fields: {
	},
	async run(req) {
		let { cid } = req.params;
		let d = new Date();
		let campQuery = new Parse.Query("Campaign");
		campQuery.equalTo("active", true);
		campQuery.greaterThan('endDate', d);
		campQuery.descending("createdAt");
		campQuery.include("product.media");
		campQuery.limit(10);
		return campQuery.find();
	}
}, {
	name: 'campaign:homepage',
	fields: {
	},
	async run(req) {
		let { cid } = req.params;
		let d = new Date();
		let campQuery = new Parse.Query("Campaign");
		campQuery.equalTo("active", true);
		campQuery.greaterThan('endDate', d);
		campQuery.descending("createdAt");
		campQuery.include("product.media");
		campQuery.include("currency");
		campQuery.include("user");
		campQuery.include("category");
		campQuery.limit(10);
		let campaigns = await campQuery.find({useMasterKey: true});
		return campaigns.map(c => ({
			id: c.id,
			name: c.get("name"),
			user: {
				id: c.get("user").id,
				name: c.get("user").get("fullname") || c.get("user").get("username")
			},
			product: {
				media: c.get("product").get("media")
			},
			category: c.get("category") ? {
				id: c.get("category").id,
				name: c.get("category").get("name")
			}: {},
			currency: {
				name: c.get("currency").get("name"),
				symbol: c.get("currency").get("symbol"),
				id: c.get("currency").id,
			},
			description: c.get("description"),
			amount: c.get("amount"),
			commission: c.get("commission"),
			mine: c.get("mine"),
			website: c.get("website"),
			contact: c.get("contact"),
			rewardType: c.get("rewardType"),
			active: c.get("active"),
			currentProduct: c.get("currentProduct"),
			amountToken: c.get("amountToken"),
			paid: c.get("paid"),
			ended: c.get("ended")
		}))
	}
}, {
	name: 'campaign:detail',
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
		let campQuery = new Parse.Query("Campaign");
		campQuery.include("currency");
		campQuery.include("user");
		campQuery.include("category");
		campQuery.include("product")
		let camDetail = await campQuery.get(cid, {useMasterKey: true});
		let node = req.user ? (await Node.nodeCode(req.user, camDetail)) : null;
		let rootNode = await Node.get(camDetail.get("rootNode").id);
		let bonusFund = await Campaign.getBonusFund(cid);
		return {
			campaign: {
				startDate: camDetail.get("startDate"),
				endDate: camDetail.get("endDate"),
				name: camDetail.get("name"),
				type: camDetail.get("type"),
				description: camDetail.get("description"),
				active: camDetail.get("active"),
				amount: camDetail.get("amount"),
				commission: camDetail.get("commission"),
				joined: rootNode.get("child")+rootNode.get("grandchild"),
				paid: camDetail.get("paid"),
				contact: camDetail.get("contact"),
				website: camDetail.get("website"),
				buyCommission: camDetail.get("commission")/4,
				referCommission: camDetail.get("commission")/4,
				id: camDetail.id,
				user: {
					id: camDetail.get("user").id,
					name: camDetail.get("user").get("fullname") || camDetail.get("user").get("username")
				},
				product: {
					media: camDetail.get("product").get("media")
				},
				category: camDetail.get("category") ? {
					id: camDetail.get("category").id,
					name: camDetail.get("category").get("name")
				}: {},
				currency: {
					name: camDetail.get("currency").get("name"),
					symbol: camDetail.get("currency").get("symbol"),
					id: camDetail.get("currency").id,
				},
				rewardType: camDetail.get("rewardType"),
				ended: camDetail.get("ended"),
				bonusFund
			},
			node
		};
	}
}, {
	name: 'campaign:topSeller',
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
		let topSeller = await NodeCampaign.topSeller(cid);
		let topReferer = await NodeCampaign.topReferer(cid);
		return { 
			topSeller: topSeller.filter(tr => tr.get("sold")).map(ts => ({
				bought: ts.get("bought"),
				networkBought: ts.get("sold"),
				fullname: ts.get("user").get("fullname") || ts.get("user").get("username"),
				username: ts.get("user").get("username"),
				avatar: ts.get("user").get("avatar")
			})), 
			topReferer: topReferer.map(tr => ({
				child: tr.get("child"),
				grandchild: tr.get("grandchild"),
				fullname: tr.get("user").get("fullname") || tr.get("user").get("username"),
				username: tr.get("user").get("username"),
				avatar: tr.get("user").get("avatar")
			}))
		}
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
