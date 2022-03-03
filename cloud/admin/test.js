const helper = require('../helper');
const NodeCamp = require('../helper/NodeCampaign');

let publicFunction = {

}

let cloudFunction = [
	{
		name: 'test:admin',
		async run(req) {
			return {message: `hello admin ${req.user.id}`};
		}
	}, {
		name: 'admin:getUserJoinedNode',
		fields: {
			uid: {
				required: true,
				type: String,
				options: val => { // verify email
					return val.length>5
				},
				error: "INVALID_ID"
			},
			cid: {
				required: true,
				type: String,
				options: val => { // verify campaign
					return val.length>5
				},
				error: "INVALID_ID"
			}
		},
		async run(req) {
			let node = await NodeCamp.get(helper.createObject(Parse.User, req.params.uid), req.params.cid);
			console.log({ node })
			console.log("active", node.get("active"))
			return {
				id: node.id,
				active: node.get("active")
			}
		}
	}
]


module.exports = {
	publicFunction, cloudFunction
}