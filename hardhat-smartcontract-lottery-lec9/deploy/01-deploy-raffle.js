const { network, ethers } = require("hardhat");
const { verify } = require("../utils/verify");
const { developmentChain, networkConfig } = require("../helper-hardhat-config");

const VRF_SUB_FUND_AMOUNT = ethers.utils.parseEther("30");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = network.config.chainId;
    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    if (developmentChain.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        // Overwrite the UI of subscription manager on Chainlink -> create, fund a subscription
        const txnRes = await vrfCoordinatorV2Mock.createSubscription();
        const txnReceipt = await txnRes.wait(1);
        subscriptionId = txnReceipt.events[0].args.subId;
        // Fund the subscription. On real network would require real token, since this is the local net, doesnt matter
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
        subscriptionId = networkConfig[chainId]["subscriptionId"];
    }

    const args = [
        vrfCoordinatorV2Address,
        networkConfig[chainId]["entranceFee"],
        networkConfig[chainId]["gasLane"],
        subscriptionId,
        networkConfig[chainId]["callbackGasLimit"],
        networkConfig[chainId]["keeperUpdateInterval"],
    ];
    // for (let i = 0; i < args.length; i++) {
    //     console.log(args[i]);
    // }
    const raffle = await deploy("Raffle", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    // Ensure the Raffle contract is a valid consumer of the VRFCoordinatorV2Mock contract.
    if (developmentChain.includes(network.name)) {
        const vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, raffle.address)
    }

    if (!developmentChain.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(raffle.address, args);
    }

    log("-----------------------------");
};

module.exports.tags = ["all", "raffle"];
