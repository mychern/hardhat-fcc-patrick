const { ethers } = require("hardhat");

const networkConfig = {
    // No need to put everything here if constant variables work well in the main deploy code.
    5: {
        // This list is based on what we need for calling the contract as well as what we need for
        // In this case, Raffle.sol.
        // Addresses available at: https://docs.chain.link/vrf/v2/subscription/supported-networks/
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D", // VRF Coordinator
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 150 gwei key hash
        subscriptionId: "8142",
        callbackGasLimit: "50000000",
        keeperUpdateInterval: "30",
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // doesnt matter
        keeperUpdateInterval: "30",
        callbackGasLimit: "500000",
    },
};

const developmentChain = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChain,
};
