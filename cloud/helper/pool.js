module.exports = {
  icoPrice: [
    "10",
    "20",
    "40",
    "80",
    "160",
    "320",
    "640",
    "1280",
    "2560",
    "5120",
    "10240",
    "20480",
    "40960",
    "81920",
    "163840",
    "327680",
    "655360",
    "1310720",
    "2621440",
    "5242880",
    "10485760",
    "20971520",
    "41943040",
    "83886080",
    "167772160",
    "335544320",
    "671088640",
    "1342177280",
    "2684354560",
    "5368709120",
  ],
  tokenBeforeICO: [
    "0",
    "353553390593273762200422",
    "603553390593273762200422",
    "780330085889910643300633",
    "905330085889910643300633",
    "993718433538229083850739",
    "1056218433538229083850739",
    "1100412607362388304125792",
    "1131662607362388304125792",
    "1153759694274467914263318",
    "1169384694274467914263318",
    "1180433237730507719332081",
    "1188245737730507719332081",
    "1193770009458527621866463",
    "1197676259458527621866463",
    "1200438395322537573133654",
    "1202391520322537573133654",
    "1203772588254542548767249",
    "1204749150754542548767249",
    "1205439684720545036584047",
    "1205927965970545036584047",
    "1206273232953546280492445",
    "1206517373578546280492445",
    "1206690007070046902446645",
    "1206812077382546902446645",
    "1206898394128297213423745",
    "1206959429284547213423745",
    "1207002587657422368912294",
    "1207033105235547368912294",
    "1207054684421984946656569",
  ],
  statusEnum: {
    ICO: 0,
    IDO: 1,
    subIDO: 2,
  },

  buy(_tokenInPool, _moneyInPool, currentStep, state, subIDOSold, amount) {
    // use BigInt for _tokenInPool, _moneyInPool
    let nextBreak;
    let assumingToken;
    let buyNowCost;
    let buyNowToken;

    amount = amount; // USDC uses 6 decimal places of precision, convert to 18
    let tokenMint = 0;
    let tokenTransferForUser = 0;
    let currentMoney = _moneyInPool;
    let moneyLeft = amount;

    while (moneyLeft > 0) {
      if (state == this.statusEnum.ICO) {
        nextBreak =
          this.tokenBeforeICO[currentStep] + 5 * 10 ** 5 - _tokenInPool;
        assumingToken = (moneyLeft * 100) / this.icoPrice[currentStep];
      } else {
        if (currentStep == 29 && state == this.statusEnum.IDO) {
          // nomore ICO
          nextBreak = 2 ** 256 - 1; // MAX_INT
        } else {
          nextBreak =
            state == this.statusEnum.subIDO
              ? subIDOSold
              : _tokenInPool - this.tokenBeforeICO[currentStep + 1];
        }
        assumingToken =
          _tokenInPool -
          (_tokenInPool * _moneyInPool) / (_moneyInPool + moneyLeft);
      }

      buyNowToken = nextBreak < assumingToken ? nextBreak : assumingToken;
      buyNowCost = moneyLeft;

      if (assumingToken > nextBreak) {
        buyNowCost =
          state == this.statusEnum.ICO
            ? (buyNowToken * this.icoPrice[currentStep]) / 100
            : (_tokenInPool * _moneyInPool) / (_tokenInPool - buyNowToken) -
              _moneyInPool;
      }
      _moneyInPool += buyNowCost;

      if (state == this.statusEnum.ICO) {
        tokenMint += buyNowToken;
        _tokenInPool += buyNowToken;
      } else {
        tokenTransferForUser += buyNowToken;
        _tokenInPool -= buyNowToken;
      }

      if (assumingToken >= nextBreak) {
        if (state == this.statusEnum.ICO) {
          state = this.statusEnum.IDO;
        } else {
          if (state == this.statusEnum.IDO) {
            currentStep += 1;
          }
          state = this.statusEnum.ICO;
          subIDOSold = 0;
        }
      } else if (state == this.statusEnum.subIDO) {
        subIDOSold -= buyNowToken;
      }
      moneyLeft = moneyLeft - buyNowCost;
    }

    return tokenMint + tokenTransferForUser;
  },

  sell(_tokenInPool, _moneyInPool, amount) {
    let receivedMoney =
      _moneyInPool - (_moneyInPool * _tokenInPool) / (_tokenInPool + amount);
    return receivedMoney;
  },
};
