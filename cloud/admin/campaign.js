const helper = require("../helper");
const Camp = require("../helper/Campaign");
const Node = require("../helper/Node");
const TokenTx = require("../helper/TokenTransaction");
const Product = require("../helper/Product");

let publicFunction = {};

let cloudFunction = [
  {
    name: "campaign:active",
    fields: {
      status: {
        required: true,
        type: Boolean,
        error: "INVALID_STATUS",
      },
      cid: {
        required: true,
        type: String,
        error: "INVALID_CAMPAIGN",
      },
    },
    async run(req) {
      let { status, cid } = req.params;
      let campQuery = new Parse.Query("Campaign");
      let campaign = await campQuery.get(cid, {
        sessionToken: req.user.getSessionToken(),
      });
      if (!campaign)
        return Promise.reject(
          new Parse.Error(Parse.Error.SCRIPT_FAILED, "INVALID_CAMPAIGN")
        );
      campaign.set("active", status);

      return campaign
        .save(null, { sessionToken: req.user.getSessionToken() })
        .then((res) => ({ id: res.id }));
    },
  },
  {
    name: "campaign:list",
    fields: {},
    async run(req) {
      const campQuery = new Parse.Query("Campaign");
      campQuery.include(["currency", "rootNode", "product"]);
      campQuery.select([
        "name",
        "amount",
        "commission",
        "type",
        "website",
        "startDate",
        "endDate",
        "currency",
        "rootNode.objectId",
        "product.name",
      ]);
      campQuery.equalTo("active", true);
      const campaigns = await campQuery.find({
        sessionToken: req.user.getSessionToken(),
      });
      return campaigns.map((campaign) => ({
        id: campaign.id,
        name: campaign.get("name"),
        currency: campaign.get("currency").get("name"),
        description: campaign.get("description"),
        website: campaign.get("website"),
        network: campaign.get("rootNode").id,
        amount: campaign.get("amount"),
        commission: campaign.get("commission"),
        type: campaign.get("type"),
        product: campaign.get("product").get("name"),
        startDate: helper.formatUTCDate(campaign.get("startDate")),
        endDate: helper.formatUTCDate(campaign.get("endDate")),
      }));
    },
  },
  {
    name: "campaign:admin:create",
    fields: {
      name: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_NAME",
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
      amount: {
        required: true,
        type: Number,
        options: (val) => {
          return val > 0;
        },
        error: "INVALID_AMOUNT",
      },
      commission: {
        required: true,
        type: Number,
        options: (val) => {
          return val > 0;
        },
        error: "INVALID_COMMISSION",
      },
      type: {
        // my product, other people's product
        type: Number,
      },
      product: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_NAME",
      },
      mine: {
        required: true,
        type: Boolean,
        error: "INVALID_MINE",
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
        rewardType,
        currency,
      } = req.params;
      product = await Product.get(product);

      const Campaign = Parse.Object.extend("Campaign");
      if (!endDate) {
        let date = new Date(startDate);
        date.setDate(date.getDate() + 60);
        endDate = date;
      }
      let campaign = new Campaign();
      campaign.set("active", true);
      campaign.set("name", name);
      campaign.set("type", type);
      campaign.set("user", req.user);
      campaign.set("description", description);
      campaign.set("startDate", new Date(startDate));
      campaign.set("endDate", new Date(endDate));
      campaign.set("amount", amount);
      campaign.set("amountToken", 0); // ********
      campaign.set("commission", commission);
      campaign.set("mine", !!mine);
      campaign.set("product", product);
      campaign.set("website", website);
      campaign.set("contact", contact);
      campaign.set("category", product.get("category"));
      campaign.set("rewardType", parseInt(rewardType || 0));
      campaign.set(
        "currency",
        helper.createObject("Currency", currency || "UyOZMa1MbQ")
      );

      let rootNode = null;
      // have a root node
      if (network) {
        rootNode = await Node.get(network);
        if (rootNode && rootNode.get("user").id == req.user.id)
          campaign.set("rootNode", rootNode);
      }
      await campaign.save(null, { sessionToken: req.user.getSessionToken() });
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
        );
        campaign.set("rootNode", rootNode);
      }
      return campaign
        .save(null, { sessionToken: req.user.getSessionToken() })
        .then((res) => ({ id: res.id }))
        .catch((e) => {
          console.log("campaign:admin:create", e);
        });
    },
  },
  {
    name: "campaign:admin:edit",
    fields: {
      cid: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_CAMPAIGN",
      },
    },
    async run(req) {
      let { cid } = req.params;
      const campaign = await Camp.get(cid);
      if (campaign) {
        const fields = [
          "name",
          "active",
          "description",
          "startDate",
          "endDate",
          "type",
          "amount",
          "amountToken",
          "commission",
          "child",
          "granchild",
          "paid",
          "contact",
          "website",
        ];
        fields.forEach((f) => campaign.set(f, req.params[f]));
        return campaign
          .save(null, {
            sessionToken: req.user.getSessionToken(),
          })
          .then((res) => ({ id: res.id }));
      }
    },
  },
  {
    name: "campaign:adminDelete",
    fields: {
      cid: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_CAMPAIGN",
      },
    },
    async run(req) {
      let { cid } = req.params;
      const campaign = await Camp.get(cid);
      if (campaign)
        return campaign.destroy({
          sessionToken: req.user.getSessionToken(),
        });
    },
  },
  {
    name: "campaign:search",
    fields: {},
    async run(req) {
      const { searchText } = req.params;
      const campQuery = new Parse.Query("Campaign");
      campQuery.fullText("name", searchText);
      const campaigns = await campQuery.find({ useMasterKey: true });
      return { campaigns };
    },
  },
  {
    name: "campaign:buyers",
    fields: {
      cid: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_CAMPAIGN",
      },
    },
    async run(req) {
      let { cid } = req.params;
      const tokenTxQuery = new Parse.Query("TokenTransaction");
      tokenTxQuery.include("node");
      tokenTxQuery.include("user");
      tokenTxQuery.include("campaign");
      tokenTxQuery.equalTo(
        "campaign",
        new Parse.Object("Campaign", { id: cid })
      );
      const txTrans = await tokenTxQuery.find({ useMasterKey: true });
      const res = [];
      const promises = [];
      const newTxTrans = txTrans.filter(
        (txTran, index, self) =>
          index ===
          self.findIndex((tx) => tx.get("node").id === txTran.get("node").id)
      );
      const txTransLen = newTxTrans.length;
      for (let i = 0; i < txTransLen; ++i) {
        const node = newTxTrans[i].get("node");
        const nodes = [];
        promises.push(TokenTx.getParentNode(node, nodes, res, tokenTxQuery));
      }
      await Promise.allSettled(promises);
      return res;
    },
  },
];

module.exports = {
  publicFunction,
  cloudFunction,
};
