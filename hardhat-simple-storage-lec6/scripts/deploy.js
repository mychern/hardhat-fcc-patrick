// imports
const { ethers, run, network } = require("hardhat");

// async main
async function main() {
  const SimpleStorageFactory = await ethers.getContractFactory("simpleStorage");
  console.log("Deploying contract...");
  const simple_storage = await SimpleStorageFactory.deploy();
  await simple_storage.deployed();
  // what is the private key?
  // what is the rpc url?
  console.log(`Deployed contract to: ${simple_storage.address}`);

  // Verify the contract, if on a testnet, given address and [optional message]
  if (network.config.chainId === 4 && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block txns");
    await simple_storage.deployTransaction.wait(6); // wait 6 blocks before running our transactions. This number is arbitrary, can be anythibg that is "a few."
    await verify(simple_storage.address, []);
  }

  // Interact with the contract
  const currentValue = await simple_storage.retrieve();
  console.log(`Current value is ${currentValue}`);
  const txnResponse = await simple_storage.store(1236472834678);
  await txnResponse.wait(1);
  const updatedValue = await simple_storage.retrieve();
  console.log(`The value is now updated to ${updatedValue}`);
}

// Verify contracts programatically
async function verify(contractAddress, args) {
  console.log("Verifying ccontract...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
  } catch (err) {
    if (err.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified!");
    } else {
      console.log(err);
    }
  }
}

// main
main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
