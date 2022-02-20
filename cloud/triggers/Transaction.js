const helper = require('../helper');
const Campaign = require('../helper/Campaign');
const Node = require('../helper/Node');
const TokenTransaction = require('../helper/TokenTransaction');

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

		if ( mine ) { // if this is my campaign, I will not take award. Or replace by system's user ******
			chainNodeId.shift();
			chainUserId.shift();
		}

		chainNodeId.reverse();
		chainUserId.reverse();
		let totalPaid = 0;
		for ( let i=0; i<chainNodeId.length; i++ ) { // need node detail to get user information
			let currentNode = helper.createObject("Node", chainNodeId[i])
			currentNode.set("user", helper.createObject(Parse.User, chainUserId[i]))

			let ratio = TokenTransaction.reward(chainNodeId.length, i)
			let amount = commission*ratio
			let amountToken = 0
			if ( amount<100 ) {
				amount = 0
				amountToken = (maxToken*ratio)/maxProduct
			}
			await TokenTransaction.create({
				params: {
					node: currentNode, 
					amount,
					amountToken,
					tx: request.object,
					metadata: {n: chainNodeId.length,i},
					campaign
				}
			})
			totalPaid += amount
		}
		campaign.increment("paid", totalPaid);
		await campaign.save(null, {useMasterKey:true});
	} catch(e) {
		console.log({e})
	}
})
