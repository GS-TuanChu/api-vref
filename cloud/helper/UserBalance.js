

module.exports = {
	async get(user, currency) {
		let query = new Parse.Query("UserBalance");
		query.equalTo("user", user);
		if ( currency ) {
			query.equalTo("currency", currency);
			return query.first({ useMasterKey: true });
		} else {
			query.include("currency");
			let balances = await query.find({ useMasterKey: true });

			let currencyQuery = new Parse.Query("Currency");
			let currencies = await currencyQuery.find();
			
			let mapBalances = {};
			balances.forEach(b => {
				mapBalances[b.get("currency").id] = b.get("balance")
			})
			return currencies.map(c => ({
				amount: mapBalances[c.id] || 0,
				currency: {
					name: c.get("name"),
					symbol: c.get("symbol"),
					id: c.id
				}
			}))
		}
	},
	async updateBalance(user, currency, amount) {
		let balance = await this.get(user, currency);
		if ( !balance ) {
			const UserBalance = Parse.Object.extend("UserBalance");
			balance = new UserBalance();
			balance.set("user", user);
			balance.set("currency", currency);
		}
		balance.set("balance", (BigInt(balance.get("balance") || 0) + BigInt(amount)).toString());
		return balance.save(null,{ useMasterKey: true }).then(res => ({ id: res.id }));
	}
}
