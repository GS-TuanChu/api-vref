/*
type: send/receive
moneyType: fiat/token/usd
amount: in string, because of store crypto currency, please use it carefully
metadata: {
	campaign,
	txId,
	isBonus: true/false,
	blockchainTxId,
}
*/
const helper = require('../helper');

module.exports = {
	async get(id) {
		let query = new Parse.Query("WalletTransaction");
		return query.get(id, { useMasterKey: true });
	},
	async getFromTx(tx, node) {
		let query = new Parse.Query("WalletTransaction");
		query.equalTo("tx", tx);
		query.equalTo("node", node);
		return query.first({ useMasterKey: true });
	},
	reward(n, i) {
		if ( n==0 || i>=n ) return 0;
		if ( n==1 ) return 0.25;
		if ( i==0 ) return 0.5; // buy directly from supplier
		if ( i==1 ) return 0.25; // return (0.25 + 1/(2**n)); // direct referer take 25% comission
		return (1/(2**(n-i+2)))
	},
	async create(req) {
		console.log("create WalletTransaction")
		let { node, amount, amountToken, tx, metadata, campaign, currency } = req.params
		
    if (!metadata.from && !currency) {
      let existed = await this.getFromTx(tx, node)
      if ( existed ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "TX_ACTIVATED"));
      currency = campaign.get("currency") || helper.createObject("Currency", "UyOZMa1MbQ")
    }

		const WalletTransaction = Parse.Object.extend("WalletTransaction");
		let newTx = new WalletTransaction();
		newTx.set("user", node.get("user"));
		newTx.set("currency", currency);
		newTx.set("amount", amount.toString());
		newTx.set("metadata", metadata);
		newTx.set("tx", tx);
		newTx.set("node", node);
		newTx.set("campaign", campaign);
    newTx.set('amountToken', amountToken)
		await newTx.save(null, {useMasterKey: true});
		console.log("done create WalletTransaction")
	},

  async updateAmount(amount, user, currencyId, note) {
    const TXQuery = new Parse.Query("Transaction")
    if (currencyId === helper.currencyConstants.VND)
      TXQuery.equalTo('objectId', helper.transactionConstants.VND)
    else if (currencyId === helper.currencyConstants.USDC_TEST)
      TXQuery.equalTo('objectId', helper.transactionConstants.USDC_TEST)
    else
      TXQuery.equalTo('objectId', helper.transactionConstants.VREF_TEST)
    TXQuery.include("campaign")
    const nodeQuery = new Parse.Query("Node")
    const tx = await TXQuery.first({useMasterKey: true})
    nodeQuery.equalTo('objectId', helper.nodeConstants.ID)
    const node = await nodeQuery.first({useMasterKey: true})
    const metadata = {
      from: "admin",
      note
    }
    node.set("user", user)
    await tx.save(null, { useMasterKey: true })
    const currencyQuery = new Parse.Query('Currency')
    currencyQuery.equalTo("objectId", currencyId)
    const currency = await currencyQuery.first({ useMasterKey: true })
    const params = {
      node,
      metadata,
      tx,
      amount,
      currency,
      campaign: tx.get('campaign')
    }
    this.create({params})
  },
}
