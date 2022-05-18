
module.exports = {
  async get(id) {
    let query = new Parse.Query("TokenTransaction");
		return query.get(id, { useMasterKey: true });
	},
	async getFromTx(tx, node) {
		let query = new Parse.Query("TokenTransaction");
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
		let { node, amount, amountToken, tx, metadata, campaign } = req.params

    if (!metadata.from) {
      let existed = await this.getFromTx(tx, node)
      if ( existed ) return Promise.reject(new Parse.Error(Parse.Error.SCRIPT_FAILED, "TX_ACTIVATED"));
    }
    const TokenTransaction = Parse.Object.extend("TokenTransaction");
    let tokenTX = new TokenTransaction();
    tokenTX.set("tx", tx);
    tokenTX.set("node", node);
    tokenTX.set("user", node.get('user'));
    tokenTX.set("amount", amount);
    tokenTX.set("amountToken", amountToken);
    tokenTX.set("metadata", metadata);
    tokenTX.set("campaign", campaign);

    return tokenTX.save(null,{ useMasterKey: true }).then(res => ({ id: res.id }));
  },
  async updateAmount(amount, user) {
    const TXQuery = new Parse.Query("Transaction")
    TXQuery.equalTo("objectId", "ryHYD5SOnq")
    const nodeQuery = new Parse.Query("Node")
    const tx = await TXQuery.first({useMasterKey: true})
    nodeQuery.equalTo("objectId", "Qsa8B4ZkAN")
    const node = await nodeQuery.first({useMasterKey: true})
    const metadata = {
      from: "admin"
    }
    node.set("user", user)

    const params = {
      node,
      metadata,
      tx,
      amount
    }
    return this.create({params}).then(res => ({ id: res.id }))
  }
}
