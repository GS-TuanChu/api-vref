const helper = require('../helper');
const BankAccount = require('../helper/BankAccount');

let publicFunction = {
}

let cloudFunction = [{
	name: 'devices:save',
	fields: {
		token: {
			required: true,
			type: String,
			options: val => {
				return val.length>10
			},
			error: "INVALID_TOKEN"
		}
	},
	async run(req) {
		let { token, metadata } = req.params;
		const Devices = Parse.Object.extend("Devices");
		let device = new Devices();
		device.set("user", req.user);
		device.set("deviceToken", token);
		device.set("metadata", metadata);
		device.set("loginSession", helper.md5(req.user.getSessionToken()));

		return device.save(null, { sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
