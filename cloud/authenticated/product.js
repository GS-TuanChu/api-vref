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
		}
	},
	async run(req) {
		let { name, media, description, price } = req.params;
		
		const Product = Parse.Object.extend("Product");
		let product = new Product();
		product.set("name", name);
		product.set("user", req.user);
		product.set("description", description);
		product.set("price", price);
		product.set("media", media);

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
			createdAt: p.get('createdAt').toISOString(),
			id: p.id
		}))
	}
}] // product:update

module.exports = {
	publicFunction, cloudFunction
}
