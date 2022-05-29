const helper = require('../helper');
const CampaignHelper = require("../helper/Campaign")
const UserHelper = require("../helper/User")

let publicFunction = {

}

let cloudFunction = [{
	name: 'tokenTx:create',
	fields: {
		ref: {
			required: true,
			type: String,
			options: val => {
				return val.length>0
			},
			error: "INVALID_REF"
		},
		campaign: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
		return publicFunction.createNode(req)
	}
},
{
  name: 'tokenTx:get',
	fields: {
		uid: {
			required: true,
			type: String,
			options: val => {
				return val.length>0
			},
			error: "INVALID_USER"
		},
		cid: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_CAMPAIGN"
		}
	},
	async run(req) {
    const { uid, cid } = req.params
    const tokenTxQuery = new Parse.Query("TokenTransaction")
    const user = await UserHelper.getById(uid)
    const campaign = await CampaignHelper.get(cid)
    tokenTxQuery.equalTo("user", user)
    tokenTxQuery.equalTo('campaign', campaign)
    const tokenTxs = await tokenTxQuery.find({ sessionToken: req.user.getSessionToken() })
    const results = []
    const fields = ["amount", "amountToken", "createdAt"]
    tokenTxs.forEach(t => {
      const object = {
      }
      fields.forEach(f => {
        object[`${f}`] = t.get(f)
      })
      results.push(object)
    })
    const meta = {
      username: user.get("username"),
      campaign: campaign.get("name")
    }
    return {results, meta}
  }
}]

module.exports = {
	publicFunction, cloudFunction
}
