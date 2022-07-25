const helper = require("../helper");
const Camp = require("../helper/Campaign");
const User = require("../helper/User");
const TokenTx = require("../helper/TokenTransaction");

let publicFunction = {};

let cloudFunction = [
  {
    name: "tokenTx:create",
    fields: {
      ref: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 0;
        },
        error: "INVALID_REF",
      },
      campaign: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 5;
        },
        error: "INVALID_CAMPAIGN",
      },
    },
    async run(req) {
      return publicFunction.createNode(req);
    },
  },
  {
    name: "tokenTx:getByCampaign",
    fields: {
      uid: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 0;
        },
        error: "INVALID_USER",
      },
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
      const { uid, cid, fromDate, toDate } = req.params;
      const tokenTxQuery = new Parse.Query("TokenTransaction");
      const user = await User.getById(uid);
      const campaign = await Camp.get(cid);
      tokenTxQuery.ascending("createdAt");
      tokenTxQuery.equalTo("user", user);
      tokenTxQuery.equalTo("campaign", campaign);
      tokenTxQuery.include("campaign.user");
      tokenTxQuery.select([
        "amount",
        "campaign",
        "campaign.name",
        "campaign.user",
        "campaign.contact",
        "metadata"
      ]);
      if (fromDate && toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        tokenTxQuery.greaterThanOrEqualTo("createdAt", fromDate);
        tokenTxQuery.lessThanOrEqualTo("createdAt", endDate);
      } else {
        tokenTxQuery.greaterThan("createdAt", { $relativeTime: "7 days ago" });
      }
      const tokenTxs = await tokenTxQuery.find({
        sessionToken: req.user.getSessionToken(),
      });
      let details = JSON.parse(JSON.stringify(tokenTxs));
      details.forEach(d => console.log(d.metadata.note))
      details = details.map((d) => ({
        id: d.objectId,
        campaign: d.campaign.name,
        amount: d.amount,
        date: helper.formatDate(d.createdAt),
        campaignOwner: d.campaign.user.username || d.campaign.user.fullname,
        contact: d.campaign.contact,
        note: d.metadata.note || ''
      }));
      const meta = {
        uid,
        cid,
        username: user.get("username"),
        campaign: campaign.get("name"),
      };
      const results = await TokenTx.arrangeByDate(tokenTxs);
      results.details = [...details];
      results.meta = { ...meta };
      return results;
    },
  },
  {
    name: "walletTx:getByCampaign",
    fields: {
      uid: {
        required: true,
        type: String,
        options: (val) => {
          return val.length > 0;
        },
        error: "INVALID_USER",
      },
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
      const { uid, cid, fromDate, toDate } = req.params;
      const walletTxQuery = new Parse.Query("WalletTransaction");
      const user = await User.getById(uid);
      const campaign = await Camp.get(cid);
      walletTxQuery.ascending("createdAt");
      walletTxQuery.equalTo("user", user);
      walletTxQuery.equalTo("campaign", campaign);
      walletTxQuery.include("campaign.user");
      walletTxQuery.select([
        "amount",
        "campaign",
        "campaign.name",
        "campaign.user",
        "campaign.contact",
        "metadata"
      ]);
      if (fromDate && toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        walletTxQuery.greaterThanOrEqualTo("createdAt", fromDate);
        walletTxQuery.lessThanOrEqualTo("createdAt", endDate);
      } else {
        walletTxQuery.greaterThan("createdAt", { $relativeTime: "7 days ago" });
      }
      const walletTxs = await walletTxQuery.find({
        sessionToken: req.user.getSessionToken(),
      });
      let details = JSON.parse(JSON.stringify(walletTxs));
      details.forEach(d => console.log(d.metadata.note))
      details = details.map((d) => ({
        id: d.objectId,
        campaign: d.campaign.name,
        amount: d.amount,
        date: helper.formatDate(d.createdAt),
        campaignOwner: d.campaign.user.username || d.campaign.user.fullname,
        contact: d.campaign.contact,
        note: d.metadata.note || ''
      }));
      const meta = {
        uid,
        cid,
        username: user.get("username"),
        campaign: campaign.get("name"),
      };
      // TODO: replace TokenTx by WalletTx
      const results = await TokenTx.arrangeByDate(walletTxs);
      results.details = [...details];
      results.meta = { ...meta };
      return results;
    },
  },
  {
    name: "tokenTx:total",
    fields: {},
    async run() {
      const tokenTxQuery = new Parse.Query("TokenTransaction");
      const total = await TokenTx.getTotalTokenTx(tokenTxQuery);
      return { total };
    },
  },
  {
    name: "tokenTx:getHistory",
    fields: {},
    async run(req) {
      const { uid, currencyId, fromDate, toDate } = req.params;
      const tokenTxQuery = new Parse.Query("TokenTransaction");
      tokenTxQuery.limit(1000);
      tokenTxQuery.ascending("createdAt");
      tokenTxQuery.select([
        "amount",
        "campaign",
        "campaign.name",
        "campaign.user",
        "campaign.contact",
      ]);
      if (currencyId) {
        if (!uid) return Promise.reject("Please specify user id");
        const campQuery = new Parse.Query("Campaign");
        const user = await User.getById(uid);
        const currencyQuery = new Parse.Query("Currency");
        currencyQuery.equalTo("objectId", currencyId);
        campQuery.matchesQuery("currency", currencyQuery); // Query only campaigns that uses the currency
        tokenTxQuery.equalTo("user", user);
        tokenTxQuery.matchesQuery("campaign", campQuery);
        tokenTxQuery.include(["campaign.currency", "campaign.user", "campaign.name"]);
      }
      if (fromDate && toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        tokenTxQuery.greaterThanOrEqualTo("createdAt", fromDate);
        tokenTxQuery.lessThanOrEqualTo("createdAt", endDate);
      } else {
        tokenTxQuery.greaterThan("createdAt", { $relativeTime: "7 days ago" });
      }
      const tokenTxs = await tokenTxQuery.find({
        sessionToken: req.user.getSessionToken(),
      });
      let details = JSON.parse(JSON.stringify(tokenTxs));
      details = details.map((d) => ({
        id: d.objectId,
        campaign: d.campaign.name,
        amount: d.amount,
        date: helper.formatDate(d.createdAt),
        campaignOwner: d.campaign.user.username || d.campaign.user.fullname,
        contact: d.campaign.contact,
      }));
      const results = await TokenTx.arrangeByDate(tokenTxs);
      results.details = [...details];
      return results;
    },
  },
  {
    name: "walletTx:getHistory",
    fields: {},
    async run(req) {
      const { uid, currencyId, fromDate, toDate } = req.params;
      const tokenTxQuery = new Parse.Query("WalletTransaction");
      tokenTxQuery.limit(1000);
      tokenTxQuery.ascending("createdAt");
      tokenTxQuery.select([
        "amount",
        "campaign",
        "campaign.name",
        "campaign.user",
        "campaign.contact",
        "metadata"
      ]);
      if (currencyId) {
        if (!uid) return Promise.reject("Please specify user id");
        const campQuery = new Parse.Query("Campaign");
        const user = await User.getById(uid);
        const currencyQuery = new Parse.Query("Currency");
        currencyQuery.equalTo("objectId", currencyId);
        campQuery.matchesQuery("currency", currencyQuery); // Query only campaigns that uses the currency
        tokenTxQuery.equalTo("user", user);
        tokenTxQuery.matchesQuery("campaign", campQuery);
        tokenTxQuery.include(["campaign.currency", "campaign.user", "campaign.name"]);
      }
      if (fromDate && toDate) {
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        tokenTxQuery.greaterThanOrEqualTo("createdAt", fromDate);
        tokenTxQuery.lessThanOrEqualTo("createdAt", endDate);
      } else {
        tokenTxQuery.greaterThan("createdAt", { $relativeTime: "7 days ago" });
      }
      const tokenTxs = await tokenTxQuery.find({
        sessionToken: req.user.getSessionToken(),
      });
      let details = JSON.parse(JSON.stringify(tokenTxs));
      details = details.map((d) => ({
        id: d.objectId,
        campaign: d.campaign.name,
        amount: d.amount,
        date: helper.formatDate(d.createdAt),
        campaignOwner: d.campaign.user.username || d.campaign.user.fullname,
        contact: d.campaign.contact,
        note: d.metadata.note || ''
      }));
      const results = await TokenTx.arrangeByDate(tokenTxs);
      results.details = [...details];
      return results;
    },
  },
];

module.exports = {
  publicFunction,
  cloudFunction,
};
