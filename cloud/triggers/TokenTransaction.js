const NodeCampaign = require('../helper/NodeCampaign');
const User = require('../helper/User');


Parse.Cloud.triggers.add("afterSave", "TokenTransaction", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj ) return true; // ignore when update
  	
	try {
		console.log("afterSave TokenTransaction", newObj.id);
		let user = newObj.get('user')
		let amount = newObj.get('amount')
		let amountToken = newObj.get('amountToken')
		let metadata = newObj.get('metadata')
    	const usr = await User.getById(user.id)
		if ( amount!=0 ) {
      		usr.increment("balance", amount);
		}
		if ( amountToken!=0 )
			usr.increment("balanceToken", amountToken);
		await usr.save(null, {useMasterKey:true});

		let nc = await NodeCampaign.get(user, newObj.get('campaign'))
		console.log("afterSave TokenTransaction", newObj.id, nc.id, metadata.i)
		console.log("afterSave TokenTransaction", nc.id, nc.get("bought"), nc.get("increment"), nc.get("sold"))
		if ( metadata.i==0 ) nc.increment("bought");
		else nc.increment("networkBought");
		if ( metadata.i==1 ) {
			if ( !nc.get("sold") ) nc.set("sold", 1)
			else nc.increment("sold");
		}
		console.log("afterSave TokenTransaction", nc.id, nc.get("bought"), nc.get("increment"), nc.get("sold"))
		await nc.save(null, {useMasterKey:true});
	} catch(e) {
		console.log("afterSave TokenTransaction", {e})
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
		console.log("afterSave TokenTransaction", {e})
	}
})
