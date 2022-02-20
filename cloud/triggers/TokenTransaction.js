const NodeCampaign = require('../helper/NodeCampaign');

Parse.Cloud.triggers.add("afterSave", "TokenTransaction", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj ) return true; // ignore when update
  	
	try {
		let user = newObj.get('user')
		let amount = newObj.get('amount')
		let amountToken = newObj.get('amountToken')
		let metadata = newObj.get('metadata')
		if ( amount!=0 )
			user.increment("balance", amount);
		if ( amountToken!=0 )
			user.increment("balanceToken", amountToken);
		await user.save(null, {useMasterKey:true});

		let nc = await NodeCampaign.get(user, newObj.get('campaign'))
		if ( metadata.i==0 ) nc.increment("bought");
		else nc.increment("networkBought");
		if ( metadata.i==1 ) nc.increment("sold");
		await nc.save(null, {useMasterKey:true});
	} catch(e) {
		console.log({e})
	}
})

Parse.Cloud.triggers.add("afterDelete", "TokenTransaction", async function(request) {
	try {
		let user = request.object.get('user')
		let amount = request.object.get('amount')
		let amountToken = request.object.get('amountToken')
		if ( amount!=0 )
			user.decrement("balance", amount);
		if ( amountToken!=0 )
			user.decrement("balanceToken", amountToken);
		await user.save(null, {useMasterKey:true});

		let nc = await NodeCampaign.get(user, request.object.get('campaign'))
		nc.decrement( metadata.i ? "networkBought" : "bought");
		await nc.save(null, {useMasterKey:true});
	} catch(e) {
		console.log({e})
	}
})