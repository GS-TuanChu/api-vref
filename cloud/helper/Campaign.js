const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("Campaign");
		return query.get(id, { useMasterKey: true });
	},
	async validCampaign(id) {
		let campaign = await this.get(id); // check time also, check bugget
		if ( !campaign || !campaign.get('active') || campaign.get('currentProduct')>=campaign.get('maxProduct') ) return false;
		return campaign;
	},
	async createTransaction(req) {
		let { cid, txid } = req.params;

		let campaign = await this.validCampaign(cid);
		if ( !campaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));

		if ( txid ) {
			let query = new Parse.Query("Transaction");
			query.equalTo("campaign", campaign);
			query.equalTo("txid", txid);
			let tx = await  query.first({ useMasterKey: true });
			if ( tx ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "DUPLICATE_TX"));
		}

		// check user permission
		if ( campaign.get("user").id!=req.user.id )
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_AUTH"));

		let now = helper.now()
		let message = [cid, now, req.user.id].join(',')
		let encrypted = helper.encrypt(message)

		return {
			content: `trans:${cid}:${encrypted.iv}|${encrypted.content}`,
			campaign: campaign.get("name"),
			commission: campaign.get("commission")
		};
	},
	async getBonusFund(cid) {
		let query = new Parse.Query("TokenTransaction");
		query.equalTo("campaign", helper.createObject("Campaign", cid));
		let records = await query.find({ useMasterKey: true });
		let totalAmount = 0;
		records.forEach(r => totalAmount += r.get("amount"));
		return totalAmount;
	}
}
