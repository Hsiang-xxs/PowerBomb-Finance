module.exports = {
  // Please use following commented addresses for deploying on Harmony mainnet
  /** 
  mainnet: {
    Global: {
      proxyAdmin: "",  // TODO: Update with the correct address
    },
    PowerBomb: {
      usdt: "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f",  // TODO: Update with the correct address
      usdc: "0x985458e523db3d53125813ed68c274899e9dfab4",  // TODO: Update with the correct address
      slp: "0x0c51171b913db10ade3fd625548e69c9c63afb96",  // TODO: Update with the correct address
      one: "0xcF664087a5bB0237a0BAd6742852ec6c8d69A27a",  // TODO: Update with the correct address
      sushi: "0xbec775cb42abfa4288de81f387a9b1a3c4bc552a",  // TODO: Update with the correct address
      sushiSwapRouter: "0x5f4467ccfa269bced8f2bc4057bbf17435d11a0d",  // TODO: Update with the correct address
      sushiSwapChef: "0x67da5f2ffaddff067ab9d5f025f8810634d84287",  // TODO: Update with the correct address
      btc: "0x95eb8075f7f7afb37f5f4cc90663f709040088e1",  // TODO: Update with the correct address
      eth: "0x6983d1e6def3690c4d616b13597a09e6193ea013",  // TODO: Update with the correct address
    }
  },
  */

  // All of them are just for test on Ethereum
  mainnet: {
    Global: {
      proxyAdmin: process.env.OWNER,  // TODO: Update with the correct address
    },
    PowerBomb: {
      usdt: "0xd417144312dbf50465b1c641d016962017ef6240", // CQT
      usdc: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", // USDC
      slp: "0x17890deb188f2de6c3e966e053da1c9a111ed4a5", // USDC/CQT SLP
      one: "0xd417144312dbf50465b1c641d016962017ef6240", // CQT
      sushi: "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2", // SUSHI
      sushiSwapRouter: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap Router
      sushiSwapChef: "0xef0881ec094552b2e128cf945ef17a6752b4ec5d", // SushiSwap Chef 
      btc: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", // WBTC
      eth: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", // WETH 
    }
  },

  testnet: {
    Global: {
      proxyAdmin: "",  // TODO: Update with the correct address
    },
    PowerBomb: {
      usdt: "",  // TODO: Update with the correct address
      usdc: "",  // TODO: Update with the correct address
      slp: "",  // TODO: Update with the correct address
      one: "",  // TODO: Update with the correct address
      sushi: "",  // TODO: Update with the correct address
      sushiSwapRouter: "",  // TODO: Update with the correct address
      sushiSwapChef: "",  // TODO: Update with the correct address
      btc: "",  // TODO: Update with the correct address
      eth: "",  // TODO: Update with the correct address
    }
  },
};
