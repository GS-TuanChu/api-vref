

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
  }
}
