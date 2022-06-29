const NodeCampaign = require('../helper/NodeCampaign');
const UserBalance = require('../helper/UserBalance');

Parse.Cloud.triggers.add("afterSave", "WalletTransaction", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj ) return true; // ignore when update
  	
	try {
		console.log("afterSave WalletTransaction", newObj.id);
		let user = newObj.get('user')
		let amount = newObj.get('amount')
		let currency = newObj.get('currency')
		if ( amount==0 ) return;

		await UserBalance.updateBalance(user, currency, amount)
	} catch(e) {
		console.log("afterSave TokenTransaction", {e})
	}
})

Parse.Cloud.triggers.add("afterDelete", "WalletTransaction", async function(request) {
	try {
		console.log("afterDelete WalletTransaction", request.object.id);
		let user = request.object.get('user')
		let amount = request.object.get('amount')
		let currency = request.object.get('currency')
		if ( amount==0 ) return;

		await UserBalance.updateBalance(user, currency, -amount)
	} catch(e) {
		console.log("afterSave TokenTransaction", {e})
	}
})