const helper = require('../helper');
const User = require('../helper/User');
const UserBalance = require('../helper/UserBalance');
const validatePhoneNumber = require('validate-phone-number-node-js'); 

let publicFunction = {
	
}

let cloudFunction = [{
	name: 'user:get',
	fields: {
	},
	async run(req) {
		let query = new Parse.Query(Parse.User);
		query.equalTo("objectId", req.user.id);
		let user = await query.first({ sessionToken: req.user.getSessionToken() });
		let balances = await UserBalance.get(user);
		return {
			id: user.id,
			username: user.get('username'),
			email: user.get('email'),
			avatar: user.get('avatar'),
			fullname: user.get('fullname'),
			phone: user.get('phone'),
			bankAccount: user.get('bankAccount'),
			createdAt: user.get('createdAt').toISOString(),
			balance: user.get('balance'),
			balanceToken: user.get('balanceToken'),
			balances
		}
	}
}, {
	name: 'user:update',
	fields: {
		fullname: {
			required: true,
			type: String,
			options: val => {
				return val.length>2
			},
			error: "INVALID_NAME"
		}
	},
	async run(req) {
		delete req.params.phone;
		if ( req.params.fuid ) {
			let phone = await helper.getPhoneFromFirebase(req.params.fuid);
			req.params.phone = phone.phone;
		}
		// if ( req.params.phone ) {
		// 	req.params.phone = helper.formatPhone(req.params.phone)
		// 	if ( !validatePhoneNumber.validate(req.params.phone) || (await User.getByPhone(req.params.phone)) )
		// 		return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "PHONE_EXISTED"));
		// }
		
		let user = req.user;
		let fields = ['fullname', 'phone', 'bankAccount', 'avatar'];
		fields.forEach(f => {
			if ( req.params.hasOwnProperty(f) )
				user.set(f, req.params[f])
		})
		await user.save(null, { sessionToken: req.user.getSessionToken() })
		return {status: true}
	}
}, {
	name: 'user:updateLanguage',
	fields: {
		language: {
			required: true,
			type: String,
			options: val => {
				return val=="vi" || val=="en";
			},
			error: "INVALID_LANGUAGE"
		}
	},
	async run(req) {
		let user = req.user;
		user.set("lang", req.params.language)
		await user.save(null, { sessionToken: req.user.getSessionToken() })
		return {status: true}
	}
}, {
	name: 'user:updateAvatar',
	fields: {
		avatar: {
			required: true,
			type: String,
			options: val => {
				return val.indexOf("http")===0;
			},
			error: "INVALID_AVATAR"
		}
	},
	async run(req) {
		let user = req.user;
		user.set("avatar", req.params.avatar)
		await user.save(null, { sessionToken: req.user.getSessionToken() })
		return {status: true}
	}
}, {
	name: 'user:checkPhone',
	fields: {
		phone: {
			required: true,
			type: String,
			options: val => {
				return val.length>5
			},
			error: "INVALID_PHONE"
		}
	},
	async run(req) {
		if ( !validatePhoneNumber.validate(req.params.phone) )
			return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_PHONE"));
		return User.getUserByPhone(req.params.phone).then(res => ({ exists: !!res }))
	}
}, {
	name: 'user:statistic',
	fields: {
	},
	async run(req) {
		
	}
},
{
	name: 'user:total',
	fields: {
	},
	async run() {
    const userQuery = new Parse.Query(Parse.User);
    let total = await User.getTotalUsers(userQuery)
    return { total }
	}
}, {
  name: 'user:getByRange',
  fields: {},
  async run(req) {
    const { fromDate, toDate } = req.params
    const userQuery = new Parse.Query(Parse.User)
    userQuery.limit(1000)
    userQuery.ascending('createdAt')
    if (fromDate && toDate) {
      userQuery.greaterThanOrEqualTo('createdAt', fromDate)
      userQuery.lessThanOrEqualTo('createdAt', toDate)
    } else {
      userQuery.greaterThan('createdAt', { $relativeTime: '7 days ago' })
    }
    const users = await userQuery.find({ sessionToken: req.user.getSessionToken() })
    const dates = []
    const counts = []
    users.forEach((current, index, self) => {
      const start = current.get('createdAt')
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const temp = self.filter(
        (tx) => tx.get('createdAt') >= start && tx.get('createdAt') <= end
      )
      self.splice(0, temp.length - 1)
      const date = helper.formatDate(start)
      dates.push(date)
      counts.push(temp.length)
    })
    return { dates, counts }
  }
}]

module.exports = {
	publicFunction, cloudFunction
}
