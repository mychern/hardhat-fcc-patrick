const networkConfig = {
  5: {
    name: "goerli",
    ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
  },
  137: {
    name: "polygon",
    ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
  },
};

const developmentChain = ["hardhat", "localhost"];
const DECIMALS = 8;
const INIT_ANS = 200000000000;

// Export, so that other files could use it.
module.exports = {
  networkConfig,
  developmentChain,
  DECIMALS,
  INIT_ANS,
};
