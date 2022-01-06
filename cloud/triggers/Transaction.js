const helper = require('../helper');
const Campaign = require('../helper/Campaign');
const Node = require('../helper/Node');
const TokenTransaction = require('../helper/TokenTransaction');

Parse.Cloud.triggers.add("afterSave", "Transaction", async function(request) {
	try {
		let campaign = await Campaign.get(request.object.get('campaign').id)
		let maxMoney = campaign.get('amount')
		let maxToken = campaign.get('amountToken')
		let maxProduct = campaign.get('maxProduct')

		campaign.increment("currentProduct");
		await campaign.save(null, {useMasterKey:true});

		let chainNode = [request.object.get('node').id]
		let nodes = {}
		for (let i=0; i<30; i++) {
			const nodeId = chainNode[chainNode.length-1]
			const node = await Node.get(nodeId)
			nodes[nodeId] = node;
			const prevNode = node.get('ref') ? node.get('ref').id : null
			if ( !prevNode ) break;
			chainNode.push(prevNode)
		}

		for ( let i=0; i<chainNode.length; i++ ) {
			let ratio = TokenTransaction.reward(chainNode.length, i)
			let amount = (maxMoney*ratio)/maxProduct
			let amountToken = 0
			if ( amount<100 ) {
				amount = 0
				amountToken = (maxToken*ratio)/maxProduct
			}

			await TokenTransaction.create({
				params: {
					node: nodes[nodeId], 
					amount,
					amountToken,
					tx: request.object,
					metadata: {n,i}
				}
			})
		}
	} catch(e) {
		console.log({e})
	}
})
