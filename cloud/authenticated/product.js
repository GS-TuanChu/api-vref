const helper = require('../helper');

let publicFunction = {

}

let cloudFunction = [{
	name: 'product:create',
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
		price: {
			type: Number,
			options: val => {
				return val>0
			},
			error: "INVALID_NAME"
		},
		// currency: {
		// 	type: String,
		// 	options: val => {
		// 		return val.length>3
		// 	},
		// 	error: "INVALID_CURRENCY"
		// },
		category: {
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CATEGORY"
		},
		contact: {
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CONTACT"
		}
	},
	async run(req) {
		let { name, media, description, price, contact, category, currency } = req.params;
		
		const Product = Parse.Object.extend("Product");
		let product = new Product();
		product.set("name", name);
		product.set("user", req.user);
		product.set("description", description);
		product.set("price", price);
		product.set("currency", helper.createObject("Currency", currency || "UyOZMa1MbQ"));
		product.set("media", media);
		product.set("contact", contact);
		product.set("category", helper.createObject("Category", category));

		return product.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}, {
	name: 'product:mine',
	fields: {
	},
	async run(req) {
		// add paging ****
		let query = new Parse.Query("Product");
		query.equalTo("user", req.user);
		query.descending("createdAt");
		let products = await query.find({ sessionToken: req.user.getSessionToken() });
		return products.map(p => ({
			name: p.get('name'),
			description: p.get('description'),
			media: p.get('media'),
			contact: p.get('contact'),
			price: p.get('price'),
			createdAt: p.get('createdAt').toISOString(),
			id: p.id
		}))
	}
}] // product:update

module.exports = {
	publicFunction, cloudFunction
}
