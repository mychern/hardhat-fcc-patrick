const { network } = require("hardhat");
const {
  developmentChain,
  DECIMALS,
  INIT_ANS,
} = require("../helper-hardhat-config.js");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  if (developmentChain.includes(network.name)) {
    // deploy mocks
    log("Local network detected! Deploying mocks...");
    await deploy(/* API function name called*/ "MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: /* input to constructor */ [DECIMALS, INIT_ANS],
    });
    log("Mocks deployed!");
    log("----------------------------------------------");
  }
};

module.exports.tags = ["all", "mocks"];
