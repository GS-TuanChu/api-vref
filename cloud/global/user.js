const helper = require('../helper');

let publicFunction = {

}

let cloudFunction = [{
	name: 'user:signup',
	fields: {
		email: {
			required: true,
			type: String,
			options: val => { // verify email
				return helper.validateEmail(val)
			},
			error: "INVALID_EMAIL"
		},
		password: {
			required: true,
			options: val => {
				return val.length >= 6
			},
			error: "INVALID_PASSWORD"
		}
	},
	async run(req) {
		let { email, password } = req.params;
		let user = await Parse.User.signUp(email, password, {email}, { useMasterKey: true })
		return { token: user.getSessionToken(), status: 200 };
	}
}] // signin

module.exports = {
	publicFunction, cloudFunction
}
