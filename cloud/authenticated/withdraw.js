const helper = require('../helper');
const BankAccount = require('../helper/BankAccount');

let publicFunction = {
}

let cloudFunction = [{
	name: 'withdraw:create',
	fields: {
		amount: {
			required: true,
			type: Number,
			options: val => {
				return val>3
			},
			error: "INVALID_AMOUNT"
		},
		bankAccount: {
			required: true,
			type: String,
			options: val => {
				return val.length>3
			},
			error: "INVALID_BANK"
		}
	},
	async run(req) {
		let { amount, bankAccount } = req.params;
		const bank = await BankAccount.get(bankAccount);
		if ( !bank || bank.get("user").id!=req.user.id ) 
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_BANK"));
		const Withdraw = Parse.Object.extend("Withdraw");
		let withdrawRequest = new Withdraw();
		withdrawRequest.set("user", req.user);
		withdrawRequest.set("amount", amount);
		withdrawRequest.set("bankAccount", bank);
		withdrawRequest.set("status", 0);

		return withdrawRequest.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}, {
	name: 'withdraw:history',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query("Withdraw");
		query.equalTo("user", req.user);
		query.include("bankAccount");
		query.descending("createdAt");
		return query.find({ sessionToken: req.user.getSessionToken() }).then(res => {
			return res.map(b => ({
				accountNumber: b.get("bankAccount").get("accountNumber"),
				accountName: b.get("bankAccount").get("accountName"),
				bankName: b.get("bankAccount").get("bankName"),
				amount: b.get("amount"),
				status: b.get("status"),
				createdAt: b.get("createdAt")
			}))
		});
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
