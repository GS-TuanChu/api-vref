const helper = require('../helper');
const Camp = require('../helper/Campaign')

let publicFunction = {
}

let cloudFunction = [{
	name: 'campaign:active',
	fields: {
		status: {
			required: true,
			type: Boolean,
			error: "INVALID_STATUS"
		},
		cid: {
			required: true,
			type: String,
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
		let { status, cid } = req.params;

		let campQuery = new Parse.Query("Campaign");
		let campaign = await campQuery.get(cid, { sessionToken: req.user.getSessionToken() });
		if ( !campaign ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN"));
		campaign.set("active", status);

		return campaign.save(null,{ sessionToken: req.user.getSessionToken() }).then(res => ({ id: res.id }));
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
