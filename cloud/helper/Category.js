const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("Category");
		return query.get(id);
	},
	async list(id) {
		let query = new Parse.Query("Category");
		return query.find();
	}
}
