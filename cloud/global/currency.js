

let publicFunction = {
}

let cloudFunction = [{
	name: 'currency:list',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query("Currency");

		return query.find().then(r => r.map(c => ({
			id: c.id,
			name: c.get("name"),
			symbol: c.get("symbol")
		})));
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
