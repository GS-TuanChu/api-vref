const Moralis = require("../helper/ConnectBlockchain");
let publicFunction = {};

let cloudFunction = [
  {
    name: "exchange:convert",
    fields: {},
    async run(req) {
      const { value, currency } = req.params;
      if (value < 0) return Promise.reject("INVALID_VALUE");
      if (currency) return Moralis.doCalculate(value, currency);
      return Moralis.doCalculate(value);
    },
  },
];

module.exports = {
  publicFunction,
  cloudFunction,
};
