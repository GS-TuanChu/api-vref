const helper = require('../helper')
const Camp = require('../helper/Campaign')
const Node = require('../helper/Node')
const TxTransaction = require('../helper/TokenTransaction')

let publicFunction = {}

let cloudFunction = [
    {
        name: 'campaign:active',
        fields: {
            status: {
                required: true,
                type: Boolean,
                error: 'INVALID_STATUS',
            },
            cid: {
                required: true,
                type: String,
                error: 'INVALID_CAMPAIGN',
            },
        },
        async run(req) {
            let { status, cid } = req.params
            let campQuery = new Parse.Query('Campaign')
            let campaign = await campQuery.get(cid, {
                sessionToken: req.user.getSessionToken(),
            })
            if (!campaign)
                return Promise.reject(
                    new Parse.Error(
                        Parse.Error.SCRIPT_FAILED,
                        'INVALID_CAMPAIGN'
                    )
                )
            campaign.set('active', status)

            return campaign
                .save(null, { sessionToken: req.user.getSessionToken() })
                .then((res) => ({ id: res.id }))
        },
    },
    {
        name: 'campaign:list',
        fields: {},
        async run(req) {
            const campQuery = new Parse.Query('Campaign')
            campQuery.equalTo('active', true)
            const campaigns = await campQuery.find({
                sessionToken: req.user.getSessionToken(),
            })
          return { campaigns }
        },
    },
    {
        name: 'campaign:adminCreate',
        fields: {
            name: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_NAME',
            },
            description: {
                type: String,
            },
            website: {
                type: String,
            },
            contact: {
                type: String,
            },
            network: {
                type: String,
            },
            startDate: {
                required: true,
            },
            endDate: {
                required: true,
            },
            amount: {
                required: true,
                type: Number,
                options: (val) => {
                    return val > 0
                },
                error: 'INVALID_AMOUNT',
            },
            commission: {
                required: true,
                type: Number,
                options: (val) => {
                    return val > 0
                },
                error: 'INVALID_COMMISSION',
            },
            type: { // my product, other people's product
                type: Number,
            },
            product: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_NAME',
            },
            mine: {
                required: true,
                type: Boolean,
                error: 'INVALID_MINE',
            },
        },
        async run(req) {
            let {
                name,
                startDate,
                endDate,
                description,
                amount,
                commission,
                type,
                product,
                network,
                mine,
                website,
                contact,
            } = req.params

            const Campaign = Parse.Object.extend('Campaign')
            let campaign = new Campaign()
            campaign.set('name', name)
            campaign.set('type', type)
            campaign.set('user', req.user)
            campaign.set('description', description)
            campaign.set('startDate', new Date(startDate))
            campaign.set('endDate', new Date(endDate))
            campaign.set('amount', amount)
            campaign.set('amountToken', 0) // ********
            campaign.set('commission', commission)
            campaign.set('mine', !!mine)
            campaign.set('product', helper.createObject('Product', product))
            campaign.set('website', website)
            campaign.set('contact', contact)

            let rootNode = null
            // have a root node
            if (network) {
                rootNode = await Node.get(network)
                if (rootNode && rootNode.get('user').id == req.user.id)
                    campaign.set('rootNode', rootNode)

                return campaign
                    .save(null, { sessionToken: req.user.getSessionToken() })
                    .then((res) => ({ id: res.id }))
                    .catch((e) => {
                        console.log('campaign:create', e)
                    })
            }
            // create root node
            if (!rootNode) {
                rootNode = await Node.createNode(
                    {
                        params: {
                            campaign: campaign.id,
                        },
                        user: req.user,
                    },
                    true
                )
                campaign.set('rootNode', rootNode)

                return campaign
                    .save(null, { sessionToken: req.user.getSessionToken() })
                    .then((res) => ({ id: res.id }))
                    .catch((e) => {
                        console.log('campaign:create', e)
                    })
            }
        },
    },
    {
        name: 'campaign:adminEdit',
        fields: {
            cid: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_CAMPAIGN',
            },
        },
        async run(req) {
            let { cid } = req.params
            const campaign = await Camp.get(cid)
            if (campaign) {
                const fields = [
                    'active',
                    'description',
                    'startDate',
                    'endDate',
                    'type',
                    'amount',
                    'amountToken',
                    'commission',
                    'child',
                    'granchild',
                    'paid',
                    'contact',
                    'website',
                ]
                fields.forEach((f) => campaign.set(f, req.params[f]))
                return campaign
                    .save(null, {
                        sessionToken: req.user.getSessionToken(),
                    })
                    .then((res) => ({ id: res.id }))
            }
        },
    },
    {
        name: 'campaign:adminDelete',
        fields: {
            cid: {
                required: true,
                type: String,
                options: (val) => {
                    return val.length > 5
                },
                error: 'INVALID_CAMPAIGN',
            },
        },
        async run(req) {
            let { cid } = req.params
            const campaign = await Camp.get(cid)
            if (campaign)
                return campaign.destroy({
                    sessionToken: req.user.getSessionToken(),
                })
        },
    },
  {
      name: 'campaign:search',
      fields: {},
      async run(req) {
        const { searchText } = req.params
        const campQuery = new Parse.Query('Campaign');
        campQuery.fullText("name", searchText)
        const campaigns = await campQuery.find({useMasterKey: true})
        return { campaigns }
      }
  },
  {
      name: 'campaign:buyers',
      fields: {
        cid: {
            required: true,
            type: String,
            options: (val) => {
                return val.length > 5
            },
            error: 'INVALID_CAMPAIGN',
        },
      },
      async run(req) {
        let { cid } = req.params
        const txTransactionQuery = new Parse.Query('TokenTransaction')
        txTransactionQuery.include('node')
        txTransactionQuery.include('user')
        txTransactionQuery.include('campaign')
        txTransactionQuery.equalTo('campaign', new Parse.Object('Campaign', { id: cid }))
        const txTrans = await txTransactionQuery.find({ useMasterKey: true })
        const res = []
        const promises = []
        const newTxTrans = txTrans.filter((txTran, index, self) => index === self.findIndex(tx => tx.get('node').id === txTran.get('node').id))
        newTxTrans.forEach(txTran => {
          const node = txTran.get('node')
          const nodes = []
          promises.push(getRootParentNode(node, nodes, res, txTransactionQuery))
        })
        await Promise.allSettled(promises)
        return res
      }
  }
]
  async function getRootParentNode(node, nodes, res, txTransactionQuery) {
    const nodeQuery = new Parse.Query("Node")
    nodeQuery.include("user")
    nodeQuery.equalTo("objectId", node.id)
    const Node = await nodeQuery.first({ useMasterKey: true })
    const parent = Node.get('parent')
    const userObj = Node.get("user")
    txTransactionQuery.equalTo('node', new Parse.Object('Node', { id: node.id }))
    txTransactionQuery.equalTo('user', new Parse.Object('_User', { id: userObj.id }))
    txTransactionQuery.greaterThan('amount', 0)
    const tx = await txTransactionQuery.find({ useMasterKey: true })
    let amount = 0
    tx.forEach(t => amount += t.get('amount'))
    const responseObj = {}
    if (!parent) {
      responseObj.id = userObj.id
      responseObj.name = userObj.get("fullname") || userObj.get("username")
      responseObj.amount = amount
      nodes.push(responseObj)
      nodes.reverse()
      res.push(nodes)
    }
    else {
      responseObj.id = userObj.id
      responseObj.name = userObj.get("fullname") || userObj.get("username")
      responseObj.amount = amount
      nodes.push(responseObj)
      return getRootParentNode(parent, nodes, res, txTransactionQuery)
    }
  }


module.exports = {
    publicFunction,
    cloudFunction,
}
