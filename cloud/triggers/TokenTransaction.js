

Parse.Cloud.triggers.add("afterSave", "TokenTransaction", async function(request) {
	try {
		let user = request.object.get('user')
		let amount = request.object.get('amount')
		let amountToken = request.object.get('amountToken')
		if ( amount!=0 )
			user.increment("balance", amount);
		if ( amountToken!=0 )
			user.increment("balanceToken", amountToken);
		await user.save(null, {useMasterKey:true});
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
	} catch(e) {
		console.log({e})
	}
})