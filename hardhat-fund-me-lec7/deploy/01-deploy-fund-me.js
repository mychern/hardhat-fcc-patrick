// The following are default configured and run, so no need to specifically write them:
// main function
// calling of main function

/** 1. The way to write a function as we know
 * async function deployFunc(hre) {
 *      console.log("hi");
 * }
 * module.exports.default = deployFunc;
 */

// 2. Instead, we could expoert drectly on the anonymous function
/** 
 * module.exports = async (hre) => {
  const { getNameAccounts, deployments } = hre;
  // Similar to calling hre.getNameAccounts & hre.deployments but
  // save the trouble of "hre".
};
*/
const { networkConfig, developmentChain } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
/** Same as:
 * const helperConfig = require("../helper-hardhat-config.js");
 * const networkConfig = helperconfig.networkConfig;
 */

// 3. We can shorten 2 even further by:
module.exports = async ({ getNamedAccounts, deployments }) => {
  // 1. get the right objects imported
  const { deploy, log, get } = deployments;
  // want to grab the deploy account from the main account
  // deploy account can be defined in config file for different networks
  const { deployer } = await getNamedAccounts(); // get the deployer account defined in config
  const chainId = network.config.chainId;

  // 2. decide which priceFeed address to use based on chainId
  // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  let ethUsdPriceFeedAddress;
  if (/* local dev chain exists */ developmentChain.includes(network.name)) {
    const ethUsdAggregator = await get("MockV3Aggregator");
    ethUsdPriceFeedAddress = ethUsdAggregator.address;
  } /* testnet */ else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
  }
  log("----------------------------------------------");
  log(
    `Data feed address picked is: ${ethUsdPriceFeedAddress} directed by chainId ${chainId}.`
  );
  log("Deploying FundMe and waiting for confirmations...");

  // 3. deploy
  const args = [ethUsdPriceFeedAddress];
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: /* address */ args, // from the steps above, this is very robust, can be local or a testnet
    // arguments to be passed into the constructor, which in FundMe's case is the priceFeedAddr
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
    // wait for several block confirmations so that Etherscan would have a chance to index our txn.
  });
  log(`FundMe deployed at ${fundMe.address}`);

  if (
    !developmentChain.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log("----------------------------------------------");
};

module.exports.tags = ["all", "fundme"];
