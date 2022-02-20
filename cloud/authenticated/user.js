
const helper = require('../helper');
const User = require('../helper/User');
const validatePhoneNumber = require('validate-phone-number-node-js'); 

let publicFunction = {
	
}

let cloudFunction = [{
	name: 'user:get',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query(Parse.User);
		query.equalTo("objectId", req.user.id);
		let user = await query.first({ sessionToken: req.user.getSessionToken() });
		return {
			id: user.id,
			username: user.get('username'),
			email: user.get('email'),
			avatar: user.get('avatar'),
			fullname: user.get('fullname'),
			phone: user.get('phone'),
			bankAccount: user.get('bankAccount'),
			createdAt: user.get('createdAt').toISOString(),
			balance: user.get('balance'),
			balanceToken: user.get('balanceToken')
		}
	}
}, {
	name: 'user:update',
	fields: {
		fullname: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_NAME"
		}
	},
	async run(req) {
		// delete req.params.phone;
		// if ( req.params.fuid ) {
		// 	let phone = await helper.getPhoneFromFirebase(req.params.fuid);
		// 	req.params.phone = phone.phone;
		// }
		if ( req.params.phone ) {
			req.params.phone = helper.formatPhone(req.params.phone)
			if ( !validatePhoneNumber.validate(req.params.phone) || (await User.getByPhone(req.params.phone)) )
				return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "PHONE_EXISTED"));
		}
		
		let user = req.user;
		let fields = ['fullname', 'phone', 'bankAccount', 'avatar'];
		fields.forEach(f => {
			if ( req.params.hasOwnProperty(f) )
				user.set(f, req.params[f])
		})
		await user.save(null, { sessionToken: req.user.getSessionToken() })
		return {status: true}
	}
}, {
	name: 'user:checkPhone',
	fields: {
		phone: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_PHONE"
		}
	},
	async run(req) {
		if ( !validatePhoneNumber.validate(req.params.phone) )
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_PHONE"));
		return User.getUserByPhone(req.params.phone).then(res => ({ exists: !!res }))
	}
}, {
	name: 'user:statistic',
	fields: {
	},
	async run(req) {
		
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
