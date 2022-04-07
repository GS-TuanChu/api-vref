const config = require('../config');
const Category = require('../helper/Category')

let publicFunction = {
}

let cloudFunction = [{
	name: 'category:listCampaign',
	fields: {
	},
	async run(req) {
		let cates = await Category.list();
		cates = cates.filter(c => c.get("active"));
		console.log({cates})
		let result = [];
		let d = new Date();
		for (let c of cates) {
			let campQuery = new Parse.Query("Campaign");
			campQuery.equalTo("active", true);
			campQuery.greaterThan('endDate', d);
			campQuery.equalTo("category", c);
			campQuery.descending("createdAt");
			campQuery.include("product");
			campQuery.limit(10);
			let campaign = await campQuery.find();

			result.push({
				category: {
					id: c.id,
					name: c.get("name"),
					desc: c.get("desc")
				},
				campaign
			})
		}
		return result;
	}
}, {
	name: 'category:list',
	fields: {
	},
	async run(req) {
		let cates = await Category.list();
		return cates.filter(c => c.get("active"));
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
