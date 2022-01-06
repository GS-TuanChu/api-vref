const helper = require('../helper');

let publicFunction = {

}

let cloudFunction = [{
	name: 'company:create',
	fields: {
		name: {
			required: true,
			type: String,
			options: val => { // verify email
				return val.length>5
			},
			error: "INVALID_NAME"
		},
		phone: {
			required: true,
			type: String,
			options: val => { // verify email
				return val.length>5
			},
			error: "INVALID_NAME"
		},
		address: {
			type: String
		},
		description: {
			type: String
		}
	},
	async run(req) {
		let { name, phone, address, description } = req.params;
		
		const Company = Parse.Object.extend("Company");
		let category = new Company();
		category.set("name", name);
		category.set("phone", phone);
		category.set("address", address);
		category.set("description", description);
		category.set("user", req.user);

		return category.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}] // company:create

module.exports = {
	publicFunction, cloudFunction
}
