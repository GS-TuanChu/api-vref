const config = require('../config');
const helper = require('../helper');
const Node = require('../helper/Node');

Parse.Cloud.triggers.add("afterSave", "Campaign", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj && oldObj.get("active")==false && newObj.get("active")==true ) {
  		try {
	  		let treasuryNode = await Node.createNode({
				params: {
					campaign: newObj.id
				},
				user: helper.createObject(Parse.User, config.treasuryUser.id),
			});

			let campaignBonusNode = await Node.createNode({
				params: {
					campaign: newObj.id
				},
				user: helper.createObject(Parse.User, config.campaignBonusUser.id),
			});
	  	} catch(e) {
	  		console.log("afterSave Campaign", e)
	  	}
  	}
})
