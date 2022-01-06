
module.exports = {
	async get(id) {
		let query = new Parse.Query("Campaign");
		return query.get(id, { useMasterKey: true });
	},
	async validCampaign(id) {
		let campaign = await this.get(id);
		if ( !campaign || !campaign.get('active') || campaign.get('currentProduct')>=campaign.get('maxProduct') ) return false;
		return campaign;
	}
}
