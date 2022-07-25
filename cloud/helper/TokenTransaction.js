const helper = require('../helper');
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
    let { node, amount, amountToken, tx, metadata, campaign, currency } = req.params

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
    tokenTX.set("currency", currency)

    return tokenTX.save(null,{ useMasterKey: true }).then(res => ({ id: res.id }));
  },
  async updateAmount(amount, user, currencyId) {
    const TXQuery = new Parse.Query("Transaction")
    TXQuery.equalTo("objectId", "ryHYD5SOnq")
    TXQuery.include("campaign")
    const nodeQuery = new Parse.Query("Node")
    const tx = await TXQuery.first({useMasterKey: true})
    nodeQuery.equalTo("objectId", "Qsa8B4ZkAN")
    const node = await nodeQuery.first({useMasterKey: true})
    const metadata = {
      from: "admin"
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
    return this.create({params}).then(res => ({ id: res.id }))
  },
  async getParentNode(node, nodes, res, tokenTxQuery) {
    let id = node.id
    while(id) {
      let responseObj = {}
      const nodeQuery = new Parse.Query("Node")
      nodeQuery.include("user")
      nodeQuery.equalTo("objectId", id)
      const Node = await nodeQuery.first({ useMasterKey: true })
      const parent = Node.get('parent')
      const userObj = Node.get("user")
      tokenTxQuery.equalTo('node', new Parse.Object('Node', { id: node.id }))
      tokenTxQuery.equalTo('user', new Parse.Object('_User', { id: userObj.id }))
      tokenTxQuery.greaterThan('amount', 0)
      const tx = await tokenTxQuery.find({ useMasterKey: true })
      let amount = 0
      tx.forEach(t => amount += t.get('amount'))
      if (!parent) {
        responseObj.id = userObj.id
        responseObj.name = userObj.get("fullname") || userObj.get("username")
        responseObj.amount = amount
      nodes.push(responseObj)
      break
      }
      responseObj.id = userObj.id
      responseObj.name = userObj.get("fullname") || userObj.get("username")
      responseObj.amount = amount
      nodes.push(responseObj)
      id = parent.id
    }
    nodes.reverse()
    res.push(nodes)
  },
  async getTotalTokenTx(tokenTxQuery) {
    tokenTxQuery.ascending('createdAt')
    const pipeline = [{
      group: {
        objectId: "$objectId",
        n: { $sum: 1 },
      }
    }]
    const result = await tokenTxQuery.aggregate(pipeline)
    return result[0].n
  },

  async arrangeByDate(tokenTxs) {
    const amounts = []
    const dates = []
    const counts = []
    const totalTokenTransaction = tokenTxs.length
    tokenTxs.forEach((current, index, self) => {
      const start = current.get('createdAt')
      start.setHours(0,0,0,0)
      const end = new Date(start)
      end.setDate(end.getDate() + 1)
      const temp = self.filter(
        (tx) => tx.get('createdAt') >= start && tx.get('createdAt') <= end
      )
      self.splice(0, temp.length - 1)
      const sumAmount = temp.map((tx) => tx.get('amount'))
      let totalAmount = sumAmount.reduce((prev, curr) => prev + curr, 0)
      const date = helper.formatDate(start)
      amounts.push(totalAmount)
      dates.push(date)
      counts.push(temp.length)
    })
    return { amounts, dates, counts, totalTokenTransaction }
  }
}
