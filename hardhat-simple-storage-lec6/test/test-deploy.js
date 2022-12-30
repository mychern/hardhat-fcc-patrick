const { ethers } = require("hardhat");
const { assert, expect } = require("chai");

describe("simpleStorage", () => {
  let simpleStorageFactory, simple_storage;
  beforeEach(async function () {
    simpleStorageFactory = await ethers.getContractFactory("simpleStorage");
    simple_storage = await simpleStorageFactory.deploy();
  });

  it("Should start with a favorite number of 0", async () => {
    const currentValue = await simple_storage.retrieve();
    const expectedVal = "0";
    assert(currentValue.toString(), expectedVal);
    expect(currentValue.toString()).to.equal(expectedVal);
  });

  it(/*.only*/ "Should update when we call store", async () => {
    const updatVal = "1234627836427458";
    const txnResponse = await simple_storage.store(updatVal);
    await txnResponse.wait(1);

    const updatedVal = await simple_storage.retrieve();
    assert(updatedVal.toString(), updatedVal);
  });

  it("Person and number match up", async () => {
    const name = "Sylvani";
    const favNum = "14";
    const txnResponse = await simple_storage.addPerson(favNum, name);
    await txnResponse.wait(1);

    const personAdded = await simple_storage.people[0];
    console.log(personAdded);
  });
});
