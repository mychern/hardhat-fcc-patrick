const { ethers, deployments, network, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChain } = require("../../helper-hardhat-config");

developmentChain.includes(network.name)
  ? describe("FundMe", async () => {
      let fundMe;
      let deployer;
      let mockV3Aggregator;
      const amountFunded = ethers.utils.parseEther("1"); // gives one ether's amount.

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("Ccnstructor", async () => {
        it("Sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("fund", async () => {
        it("Should fail if not enough ETH is sent", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("Updated the amount funded data structure", async () => {
          await fundMe.fund({ value: amountFunded });
          const response = await fundMe.getAddressToAmountFunded(deployer); //Why? // Also note this indexing
          assert.equal(amountFunded.toString(), response.toString());
        });
        it("Added funders to array of funders", async () => {
          await fundMe.fund({ value: amountFunded });
          const funder = await fundMe.getFunder(0); // Also the indexing here
          assert.equal(deployer, funder);
        });
      });

      describe("withdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: amountFunded });
        });

        it("Only the owner can withdraw", async () => {
          // Arrange
          const accountBalanceBeforeTxn = await fundMe.provider.getBalance(
            /*contract account =*/ fundMe.address
          );
          const funderBalanceBeforeTxn = await fundMe.provider.getBalance(
            /*funder account =*/ deployer
          );

          // Act
          const TxnResponse = await fundMe.withdraw();
          const TxnReceipt = await TxnResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = TxnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingAccountBalance = await fundMe.provider.getBalance(
            /*contract account =*/ fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            /*funder account =*/ deployer
          );

          // Assert
          assert.equal(endingAccountBalance, 0);
          assert.equal(
            endingFunderBalance.add(gasCost).toString(),
            funderBalanceBeforeTxn.add(accountBalanceBeforeTxn).toString()
          );
        });
        it("Works as intended on multiple accounts.", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // because 1 is already used as the deployer
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: amountFunded });
          }
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const TxnResponse = await fundMe.withdraw();
          const TxnReceipt = await TxnResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = TxnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingAccountBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingAccountBalance, 0);
          assert.equal(
            endingFunderBalance.add(gasCost).toString(),
            startingContractBalance.add(startingDeployerBalance).toString()
          );
          // Also need to make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            // because 1 is already used as the deployer
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only allows th eowner to withdraw", async () => {
          const accounts = await ethers.getSigners();
          const attackerConnectedContract = await fundMe.connect(accounts[1]);
          await expect(attackerConnectedContract.withdraw()).to.be
            .reverted /*With(
        "FundMe__NotOwner"
      )*/;
        });
      });

      describe("cheaperWithdraw", async () => {
        beforeEach(async () => {
          await fundMe.fund({ value: amountFunded });
        });

        it("Only the owner can cheaperWithdraw", async () => {
          // Arrange
          const accountBalanceBeforeTxn = await fundMe.provider.getBalance(
            /*contract account =*/ fundMe.address
          );
          const funderBalanceBeforeTxn = await fundMe.provider.getBalance(
            /*funder account =*/ deployer
          );

          // Act
          const TxnResponse = await fundMe.cheaperWithdraw();
          const TxnReceipt = await TxnResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = TxnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingAccountBalance = await fundMe.provider.getBalance(
            /*contract account =*/ fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            /*funder account =*/ deployer
          );

          // Assert
          assert.equal(endingAccountBalance, 0);
          assert.equal(
            endingFunderBalance.add(gasCost).toString(),
            funderBalanceBeforeTxn.add(accountBalanceBeforeTxn).toString()
          );
        });
        it("Works as intended on multiple accounts.", async () => {
          // Arrange
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            // because 1 is already used as the deployer
            const fundMeConnectedContract = await fundMe.connect(accounts[i]);
            await fundMeConnectedContract.fund({ value: amountFunded });
          }
          const startingContractBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Act
          const TxnResponse = await fundMe.cheaperWithdraw();
          const TxnReceipt = await TxnResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = TxnReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);
          const endingAccountBalance = await fundMe.provider.getBalance(
            fundMe.address
          );
          const endingFunderBalance = await fundMe.provider.getBalance(
            deployer
          );

          // Assert
          assert.equal(endingAccountBalance, 0);
          assert.equal(
            endingFunderBalance.add(gasCost).toString(),
            startingContractBalance.add(startingDeployerBalance).toString()
          );
          // Also need to make sure that the funders are reset properly
          await expect(fundMe.getFunder(0)).to.be.reverted;
          for (i = 1; i < 6; i++) {
            // because 1 is already used as the deployer
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only allows th eowner to cheaperWithdraw", async () => {
          const accounts = await ethers.getSigners();
          const attackerConnectedContract = await fundMe.connect(accounts[1]);
          await expect(attackerConnectedContract.cheaperWithdraw()).to.be
            .reverted /*With(
        "FundMe__NotOwner"
      )*/;
        });
      });
    })
  : describe.skip;
