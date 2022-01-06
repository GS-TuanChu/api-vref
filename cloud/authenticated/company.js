const helper = require('../helper');

let publicFunction = {

}

let cloudFunction = [{
	name: 'company:update',
	fields: {
		// email: {
		// 	required: true,
		// 	type: String,
		// 	options: val => { // verify email
		// 		return helper.validateEmail(val)
		// 	},
		// 	error: "INVALID_EMAIL"
		// }
	},
	async run(req) {
		
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
