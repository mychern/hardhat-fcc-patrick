const { developmentChain } = require("../helper-hardhat-config");
const { network } = require("hardhat");

const BASE_FEE = ethers.utils.parseEther("0.25"); // For the premium, as the service costs 0.25 LINK per request. Refer to documentation.
// Or, view constructor function of VRFCoordinatorV2Mock.sol.
const GAS_PRICE_LINK = 1e9; // calculated value based on the gas price of the chain.
// LINK per gas so that the chain will not run on deficit when providing services.

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const args = [BASE_FEE, GAS_PRICE_LINK];
    log(developmentChain[0]);

    if (developmentChain.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("VRFCoordinatorV2Mock", {
            from: deployer,
            log: true,
            args: args,
        });
        log("Mock deployed!");
        log("----------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
