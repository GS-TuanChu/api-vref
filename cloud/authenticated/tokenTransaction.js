const helper = require('../helper');
const CampaignHelper = require("../helper/Campaign")
const User = require("../helper/User")
const TokenTx = require("../helper/TokenTransaction")

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
  name: 'tokenTx:getByRange',
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
    const { uid, cid, fromDate, toDate } = req.params
    const tokenTxQuery = new Parse.Query("TokenTransaction")
    const user = await User.getById(uid)
    const campaign = await CampaignHelper.get(cid)
    tokenTxQuery.ascending('createdAt')
    tokenTxQuery.equalTo("user", user)
    tokenTxQuery.equalTo('campaign', campaign)
    if (fromDate && toDate) {
      tokenTxQuery.greaterThanOrEqualTo('createdAt', fromDate)
      tokenTxQuery.lessThanOrEqualTo('createdAt', toDate)
    } else {
      tokenTxQuery.greaterThan('createdAt', { $relativeTime: '7 days ago' })
    }
    const tokenTxs = await tokenTxQuery.find({ sessionToken: req.user.getSessionToken() })
    const results = []
    const dates = []
    const counts = []
    const amounts = []
    const fields = ["amount", "amountToken", "createdAt"]
    tokenTxs.forEach(t => {
      const object = {}
      fields.forEach(f => {
        object[`${f}`] = t.get(f)
      })
      results.push(object)
    })
    tokenTxs.forEach((current, index, self) => {
      const start = current.get('createdAt')
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const temp = self.filter(
        (tx) => tx.get('createdAt') >= start && tx.get('createdAt') <= end
      )
      self.splice(0, temp.length - 1)
      const sumAmount = temp.map((tx) => tx.get('amount'))
      let totalAmount = sumAmount.reduce((prev, curr) => prev + curr, 0)
      const date = helper.formatDate(start)
      amounts.push(totalAmount)
      dates.push(date)
      counts.push(temp.length)
    })
    const meta = {
      uid,
      cid, 
      username: user.get("username"),
      campaign: campaign.get("name")
    }
    return {results, meta, dates, amounts, counts}
  }
}, {
  name: 'tokenTx:getAll',
  fields: {},
  async run(req) {
    const { fromDate, toDate } = req.params
    const tokenTxQuery = new Parse.Query("TokenTransaction")
    tokenTxQuery.limit(1000)
    tokenTxQuery.ascending('createdAt')
    if (fromDate && toDate) {
      tokenTxQuery.greaterThanOrEqualTo('createdAt', fromDate)
      tokenTxQuery.lessThanOrEqualTo('createdAt', toDate)
    } else {
      tokenTxQuery.greaterThan('createdAt', { $relativeTime: '7 days ago' })
    }
    const tokenTxs = await tokenTxQuery.find( {sessionToken: req.user.getSessionToken()} )
    const amounts = []
    const dates = []
    const counts = []
    const totalTokenTransaction = tokenTxs.length
    tokenTxs.forEach((current, index, self) => {
      const start = current.get('createdAt')
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const temp = self.filter(
        (tx) => tx.get('createdAt') >= start && tx.get('createdAt') <= end
      )
      self.splice(0, temp.length - 1)
      const sumAmount = temp.map((tx) => tx.get('amount'))
      let totalAmount = sumAmount.reduce((prev, curr) => prev + curr, 0)
      const date = helper.formatDate(start)
      amounts.push(totalAmount)
      dates.push(date)
      counts.push(temp.length)
    })
    return { amounts, dates, counts, totalTokenTransaction }
  }
}, {
    name: 'tokenTx:total',
    fields: {
    },
    async run() {
      const tokenTxQuery = new Parse.Query("TokenTransaction")
      const total = await TokenTx.getTotalTokenTx(tokenTxQuery)
      return { total }
	}
}]

module.exports = {
	publicFunction, cloudFunction
}
