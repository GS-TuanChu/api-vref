const helper = require('../helper');
const config = require('../config');
const Campaign = require('../helper/Campaign');
const Node = require('../helper/Node');
const NodeCampaign = require('../helper/NodeCampaign');
const TokenTransaction = require('../helper/TokenTransaction');
const WalletTransaction = require('../helper/WalletTransaction');

Parse.Cloud.triggers.add("afterSave", "Transaction", async function(request) {
	var newObj = request.object;
  	var oldObj = request.original;
  	if ( oldObj ) return true; // ignore when update
  	
	try {
		let campaign = await Campaign.get(request.object.get('campaign').id)
		let maxMoney = campaign.get('amount')
		let maxToken = campaign.get('amountToken')
		let commission = campaign.get('commission')
		let paid = campaign.get('paid')
		let mine = campaign.get('mine')
		let rootNode = campaign.get('rootNode')

		if ( paid+commission>maxMoney ) {
			// log somewhere
			return false;
		}
		let node = await Node.get(request.object.get('node').id)
		let tmpChainNodeId = node.get("ref") || []
		let tmpChainUserId = node.get("refUser") || []
			tmpChainNodeId.push(request.object.get('node').id)
			tmpChainUserId.push(request.object.get('user').id)

		// Cut the chain to rootNode
		let chainNodeId = [], chainUserId = [], found = false;
		for (let i=0; i<tmpChainNodeId.length; i++) {
			if ( tmpChainNodeId[i]==rootNode.id )
				found = true;
			if ( !found ) continue;
			chainNodeId.push(tmpChainNodeId[i])
			chainUserId.push(tmpChainUserId[i])
		}

		if ( mine ) { // if this is my campaign, I will not take award
			chainNodeId.shift();
			chainUserId.shift();
		}

		chainNodeId.reverse();
		chainUserId.reverse();
		let totalPaid = 0;
		for ( let i=0; i<chainNodeId.length; i++ ) {
			let user = helper.createObject(Parse.User, chainUserId[i]);
			user.useMasterKey = true;
			let nodeCamp = await NodeCampaign.get(user, campaign, false);
			if ( !nodeCamp ) continue; // nodeCamp must be exsited
			let currentNode = nodeCamp.get("node");
			if ( !nodeCamp.get("active") || !nodeCamp.get("node").get("active") ) { // if this node is not active, then transfer money to user treasury
				nodeCamp = await NodeCampaign.get(helper.createObject(Parse.User, config.treasuryUser.id), campaign);
				currentNode = nodeCamp.get("node");
			}

			let ratio = TokenTransaction.reward(chainNodeId.length, i)
			let amount = parseInt(commission*ratio)
			let amountToken = 0
			// if ( amount<100 ) {
			// 	amount = 0
			// 	amountToken = (maxToken*ratio)/maxProduct
			// }
			await TokenTransaction.create({
				params: {
					node: currentNode, 
					amount,
					amountToken,
					tx: request.object,
					metadata: {n: chainNodeId.length, i},
					campaign
				}
			})

			await WalletTransaction.create({
				params: {
					node: currentNode, 
					amount,
					amountToken,
					tx: request.object,
					metadata: {n: chainNodeId.length, i},
					campaign
				}
			})
			totalPaid += amount
		}
		let moneyLeft = commission - totalPaid;
		if ( moneyLeft>0 ) { // send all change to campaignbonus@gostream
			let bonusNode = await NodeCampaign.get(helper.createObject(Parse.User, config.campaignBonusUser.id), campaign);
			await TokenTransaction.create({
				params: {
					node: bonusNode.get("node"), 
					amount: moneyLeft,
					amountToken: 0,
					tx: request.object,
					metadata: {n: chainNodeId.length, i: -1},
					campaign
				}
			})

			await WalletTransaction.create({
				params: {
					node: bonusNode.get("node"), 
					amount: moneyLeft,
					amountToken: 0,
					tx: request.object,
					metadata: {n: chainNodeId.length, i: -1},
					campaign
				}
			})
		}
		campaign.increment("paid", commission);
		campaign.increment("currentProduct");
		await campaign.save(null, {useMasterKey:true});
	} catch(e) {
		console.log("afterSave Transaction", {e})
	}
})
