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
		campQuery.include("product.media")
		return campQuery.find();
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
		campQuery.include("product")
		let camDetail = await campQuery.get(cid);
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
				user: camDetail.get("user").id,
				product: {
					media: camDetail.get("product").get("media"),
					website: camDetail.get("product").get("website")
				},
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
				fullname: ts.get("user").get("fullname"),
				username: ts.get("user").get("username")
			})), 
			topReferer: topReferer.map(tr => ({
				child: tr.get("child"),
				grandchild: tr.get("grandchild"),
				fullname: tr.get("user").get("fullname"),
				username: tr.get("user").get("username")
			}))
		}
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
