const path = require("path");
const pool = require("./pool");
const Moralis = require("moralis/node");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const blockchainConfig = {
  abi: [
    { inputs: [], stateMutability: "nonpayable", type: "constructor" },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "owner",
          type: "address",
        },
        {
          indexed: true,
          internalType: "address",
          name: "spender",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Approval",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: true,
          internalType: "address",
          name: "from",
          type: "address",
        },
        { indexed: true, internalType: "address", name: "to", type: "address" },
        {
          indexed: false,
          internalType: "uint256",
          name: "value",
          type: "uint256",
        },
      ],
      name: "Transfer",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_address",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "buy",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: "bool", name: "_status", type: "bool" },
      ],
      name: "changestatus",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "address",
          name: "_address",
          type: "address",
        },
        {
          indexed: false,
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "sell",
      type: "event",
    },
    {
      anonymous: false,
      inputs: [
        {
          indexed: false,
          internalType: "uint256",
          name: "_amount",
          type: "uint256",
        },
      ],
      name: "withdraw",
      type: "event",
    },
    {
      inputs: [],
      name: "_moneyInPool",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "_tokenInPool",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "owner", type: "address" },
        { internalType: "address", name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "account", type: "address" }],
      name: "balanceOf",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "expected", type: "uint256" },
      ],
      name: "buyToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_address", type: "address" }],
      name: "changeOwner",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "bool", name: "_status", type: "bool" }],
      name: "changeStatus",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [{ internalType: "address", name: "_address", type: "address" }],
      name: "changeWithdrawAddress",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "collectWastedToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "currentStep",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "subtractedValue", type: "uint256" },
      ],
      name: "decreaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "spender", type: "address" },
        { internalType: "uint256", name: "addedValue", type: "uint256" },
      ],
      name: "increaseAllowance",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "name",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "uint256", name: "amount", type: "uint256" },
        { internalType: "uint256", name: "expected", type: "uint256" },
      ],
      name: "sellToken",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "state",
      outputs: [
        { internalType: "enum VREF.statusEnum", name: "", type: "uint8" },
      ],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "status",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "subIDOSold",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "symbol",
      outputs: [{ internalType: "string", name: "", type: "string" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [],
      name: "totalSupply",
      outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { internalType: "address", name: "from", type: "address" },
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transferFrom",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "withdrawMoney",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
  decimals: 18,
};
const options = {
  chain: "bsc",
  address: "0x2b7Cc0556F82A23e17eD47339081c0160CCC64FC",
  function_name: "",
  abi: blockchainConfig.abi,
  params: {},
};
(() =>
  Moralis.start({
    serverUrl: process.env.MORALIS_SERVERURL,
    appId: process.env.MORALIS_APPID,
    masterKey: process.env.MORALIS_MASTERKEY,
  }))();

module.exports = {
  blockchainConfig,
  options,
  async _moneyInPool() {
    this.options = {
      ...this.options,
      function_name: "_moneyInPool",
    };
    return await Moralis.Web3API.native.runContractFunction(this.options);
  },
  async _tokenInPool() {
    this.options = {
      ...this.options,
      function_name: "_tokenInPool",
    };
    return await Moralis.Web3API.native.runContractFunction(this.options);
  },
  async _subIDOSold() {
    this.options = {
      ...this.options,
      function_name: "subIDOSold",
    };
    return await Moralis.Web3API.native.runContractFunction(this.options);
  },
  async _currentStep() {
    this.options = {
      ...this.options,
      function_name: "currentStep",
    };
    return await Moralis.Web3API.native.runContractFunction(this.options);
  },
  async _state() {
    this.options = { ...this.options, function_name: "state" };
    return await Moralis.Web3API.native.runContractFunction(this.options);
  },
  async doCalculate(value, currency = "vref") {
    let _moneyInPool =
      (await this._moneyInPool()) / 10 ** this.blockchainConfig.decimals;
    let _tokenInPool =
      (await this._tokenInPool()) / 10 ** this.blockchainConfig.decimals;
    let delta;
    let method = "buyToken";
    if (currency == "vref") {
      // vref to usdc
      delta = pool.sell(_tokenInPool, _moneyInPool, value);
      method = "sellToken";
    } else {
      let currentStep = parseInt(await this._currentStep());
      let state = parseInt(await this._state());
      let subIDOSold =
        (await this._subIDOSold()) / 10 ** this.blockchainConfig.decimals;
      delta = pool.buy(
        _tokenInPool,
        _moneyInPool,
        currentStep,
        state,
        subIDOSold,
        value
      );
    }
    return delta;
  },
};
