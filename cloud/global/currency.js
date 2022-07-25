

let publicFunction = {
}

let cloudFunction = [{
	name: 'currency:list',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query("Currency");

		return query.find({ sessionToken: req.user.getSessionToken() }).then(r => r.map(c => ({
			id: c.id,
			name: c.get("name"),
			symbol: c.get("symbol")
		})));
	},
},
  {
    name: 'currency:get',
    fields: {
      currencyId: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_CURRENCY",
      }
    },
    async run(req) {
      const { currencyId } = req.params
      let query = new Parse.Query("Currency")
      query.equalTo("objectId", currencyId)
      const currency = await query.find({ sessionToken: req.user.getSessionToken() })
      return query.find({ sessionToken: req.user.getSessionToken() }).then(r => r.map(c => ({
        id: c.id,
        name: c.get("name"),
        symbol: c.get("symbol")
      })))
    }
  }
]

module.exports = {
	publicFunction, cloudFunction
}
