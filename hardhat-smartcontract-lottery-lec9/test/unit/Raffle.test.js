const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { developmentChain, networkConfig } = require("../../helper-hardhat-config");
const { expect, assert } = require("chai");

!developmentChain.includes(network.name)
    ? describe.skip
    : describe("Raffle Unit Tests (localhost)", async () => {
          let deployer, raffle, vrfCoordinatorV2Mock, raffleEntranceFee, interval;
          const chainId = network.config.chainId;

          beforeEach(async () => {
              accounts = await ethers.getSigners(); // could also do with getNamedAccounts
              deployer = accounts[0].address;
              player = accounts[1];
              await deployments.fixture(["all"]);
              raffle = await ethers.getContract("Raffle", deployer);
              vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
              raffleEntranceFee = await raffle.getEntranceFee();
              interval = await raffle.getInterval();
          });

          describe("constructor", () => {
              it("Initialized correctly", async () => {
                  // Ideally, don't test all these in one it
                  const raffleState = await raffle.getRaffleState();
                  assert.equal(raffleState.toString(), "0");
                  assert.equal(interval.toString(), networkConfig[chainId]["keeperUpdateInterval"]);
                  // should write tests for the rest of the parameters, but save the trouble for now...
              });
          });

          describe("enterRaffle", () => {
              it("Reverts when not paid enough", async () => {
                  await expect(raffle.enterRaffle()).to.be.revertedWith(
                      "Raffle__PayMoreToEnterRaffle"
                  );
              });
              it("Records players when enter", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  const playerFromContract = await raffle.getPlayer(0);
                  assert.equal(playerFromContract, deployer);
              });
              it("Admits event on enter", async () => {
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.emit(
                      raffle,
                      "RaffleEnter"
                  );
              });
              it("doesnt allow entrance when raffle is being calculated", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  // for a documentation of the methods below, go here: https://hardhat.org/hardhat-network/reference
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  // we pretend to be a keeper for a second
                  await raffle.performUpkeep([]); // changes the state to calculating for our comparison below
                  await expect(raffle.enterRaffle({ value: raffleEntranceFee })).to.be.revertedWith(
                      // is reverted as raffle is calculating
                      "Raffle__NotOpen"
                  );
              });
          });

          describe("checkUpkeep", () => {
              it("returns false if no ETH sent by anyone by interval is up", async () => {
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert(!upkeepNeeded);
              });
              it("returns false if raffleState not open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  // equivalent to await network.provider.send("evm_mine", []); used previously.
                  await raffle.performUpkeep([]); // "0x" can replace []. Either would mean `empty input`
                  const raffleState = await raffle.getRaffleState();
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep([]);
                  assert.equal(raffleState.toString(), "1");
                  assert(!upkeepNeeded);
              });
              it("returns false if enough time hasn't passed", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]); // use a higher number here if this test fails
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(!upkeepNeeded);
              });
              it("returns true if enough time has passed, has players, eth, and is open", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.request({ method: "evm_mine", params: [] });
                  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep("0x"); // upkeepNeeded = (timePassed && isOpen && hasBalance && hasPlayers)
                  assert(upkeepNeeded);
              });
          });

          describe("performUpkeep", () => {
              it("only runs if checkUpkeep is true", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const tx = await raffle.performUpkeep([]);
                  assert(tx);
              });
              it("revert when checkUpkeep is false", async () => {
                  await expect(raffle.performUpkeep([])).to.be.revertedWith(
                      "Raffle__UpkeepNotNeeded"
                  );
              });
              it("updates the raffle state, emits and event, and calls the VRF coordinator", async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
                  const txResponse = await raffle.performUpkeep([]);
                  const txReceipt = await txResponse.wait(1);
                  const requestId = txReceipt.events[1].args.requestId;
                  // events[1] because we want the second event which is the one we logged.
                  // The first event is default run by VRF coordinator v2 contract.
                  const raffleState = await raffle.getRaffleState();
                  assert(requestId.toNumber() > 0);
                  assert(raffleState.toString() == "1");
              });
          });

          describe("fulfillRandomWords", () => {
              beforeEach(async () => {
                  await raffle.enterRaffle({ value: raffleEntranceFee });
                  await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                  await network.provider.send("evm_mine", []);
              });
              it("can only be called after performUpkeep", async () => {
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)
                  ).to.be.revertedWith("nonexistent request");
                  await expect(
                      vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)
                  ).to.be.revertedWith("nonexistent request");
              });
              it("picks a winner, resets, and sends money", async () => {
                  const addTestAccounts = 5;
                  const startIndex = 1;
                  for (let i = startIndex; i < startIndex + addTestAccounts; i++) {
                      const accountConnectedRaffle = raffle.connect(accounts[i]);
                      await accountConnectedRaffle.enterRaffle({ value: raffleEntranceFee });
                  }
                  const startingTimeStamp = await raffle.getLastTimeStamp();
                  // performUpkeep's mock is chainlink keepers
                  // fulfillRandomWords' mock is the chainlink VRF
                  await new Promise(async (res, rej) => {
                      raffle.once("AddressPickedWinner", async () => {
                          console.log("AddressPickedWinner event has been triggered!");
                          try {
                              const recentWinner = await raffle.getRecentWinner();
                              // This is how we compare and find the recent winner:
                              //   console.log(recentWinner);
                              //   console.log(accounts[0].address);
                              //   console.log(accounts[1].address);
                              //   console.log(accounts[2].address);
                              //   console.log(accounts[3].address);
                              //   console.log(accounts[4].address);
                              //   console.log(accounts[5].address);
                              //   console.log(accounts[6].address);
                              const raffleState = await raffle.getRaffleState();
                              const endingTimeStamp = await raffle.getLastTimeStamp();
                              const numPlayers = await raffle.getNumberOfPlayers();
                              const endingWinnerBalance = await accounts[5].getBalance();
                              // tests
                              await expect(raffle.getPlayer(0)).to.be.reverted;
                              assert.equal(numPlayers.toString(), "0");
                              assert.equal(recentWinner.toString(), accounts[5].address);
                              assert.equal(raffleState, 0);
                              assert(endingTimeStamp > startingTimeStamp);
                              assert.equal(
                                  endingWinnerBalance.toString(),
                                  winnerStartingBalance.add(
                                      raffleEntranceFee
                                          .mul(addTestAccounts)
                                          .add(raffleEntranceFee)
                                          .toString()
                                  )
                              );
                          } catch (err) {
                              rej(err);
                          }
                          res();
                      });
                      const tx = await raffle.performUpkeep([]);
                      const txReceipt = await tx.wait(1);
                      const winnerStartingBalance = await accounts[5].getBalance();
                      await vrfCoordinatorV2Mock.fulfillRandomWords(
                          txReceipt.events[1].args.requestId,
                          raffle.address
                      );
                  });
              });
          });
      });
