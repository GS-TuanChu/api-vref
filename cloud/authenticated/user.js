
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
		},
		phone: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_PHONE"
		},
		bankAccount: {
			required: false,
			type: String
		}
	},
	async run(req) {
		let { fullname, phone, bankAccount } = req.params;
		let user = req.user;
		user.set("fullname", fullname)
		user.set("phone", phone)
		user.set("bankAccount", bankAccount)
		await user.save(null, { sessionToken: req.user.getSessionToken() })
		return {status: true}
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
