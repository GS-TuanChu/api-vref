const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("BankAccount");
		return query.get(id, { useMasterKey: true });
	}
}
