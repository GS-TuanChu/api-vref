

module.exports = {
	async getByPhone(phone) {
		let query = new Parse.Query(Parse.User);
		query.equalTo("phone", phone);
		return query.first({ useMasterKey: true });
	},
  async getById(id) {
		let query = new Parse.Query(Parse.User);
		query.equalTo("objectId", id);
		return query.first({ useMasterKey: true });
  },
  async getTotalUsers(userQuery) {
    const pipeline = [{
      group: {
        objectId: "$objectId",
        n: { $sum: 1 },
      }
    }]
    const result = await userQuery.aggregate(pipeline)
    return result[0].n
  }
}
