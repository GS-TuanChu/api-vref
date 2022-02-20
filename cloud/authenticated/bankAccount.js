const helper = require('../helper');
const BankAccount = require('../helper/BankAccount');

let publicFunction = {
}

let cloudFunction = [{
	name: 'bankAccount:create',
	fields: {
		accountNumber: {
			required: true,
			type: String,
			options: val => {
				return val.length>3
			},
			error: "INVALID_ACCOUNT_NUMBER"
		},
		accountName: {
			required: true,
			type: String,
			options: val => {
				return val.length>3
			},
			error: "INVALID_ACCOUNT_NAME"
		},
		bankName: {
			required: true,
			type: String,
			options: val => {
				return val.length>3
			},
			error: "INVALID_BANK_NAME"
		}
	},
	async run(req) {
		let { accountNumber, accountName, bankName } = req.params;
		const Account = Parse.Object.extend("BankAccount");
		let account = new Account();
		account.set("user", req.user);
		account.set("accountNumber", accountNumber);
		account.set("accountName", accountName);
		account.set("bankName", bankName);

		return account.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}, {
	name: 'bankAccount:remove',
	fields: {
		id: {
			required: true,
			type: String,
			options: val => {
				return val.length>3
			},
			error: "INVALID_ID"
		}
	},
	async run(req) {
		let { id } = req.params;
		let account = helper.createObject("BankAccount", id)
		return account.destroy({ sessionToken: req.user.getSessionToken() });
	}
}, {
	name: 'bankAccount:get',
	fields: {
	},
	async run(req) {
		let { id } = req.params;
		if ( id ) return BankAccount.get(id);
		let query = new Parse.Query("BankAccount");
		query.equalTo("user", req.user);
		return query.find({ sessionToken: req.user.getSessionToken() }).then(res => {
			return res.map(b => ({
				id: b.id,
				accountNumber: b.get("accountNumber"),
				accountName: b.get("accountName"),
				bankName: b.get("bankName")
			}))
		});
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
