const { ethers } = require("hardhat");
const { assert, expect } = require("chai");
const { describe } = require("node:test");

describe("simpleStorage", () => {
  let simpleStorageFactory, simple_storage;
  const name1 = "Sylvani";
  const name2 = "Andrew";
  const favNum1 = "14";
  const favNum2 = "8";
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

  describe("addPerson function works as intended", async () => {
    it("Person and number match up", async () => {
      await simple_storage.addPerson(favNum1, name1);
      const personAdded = await simple_storage.people(0);
      assert.equal(personAdded[0].toString(), favNum1);
      assert.equal(personAdded[1].toString(), name1);
    });

    it("addPerson works for more than one entries", async () => {
      // First entry.
      const name1 = "Sylvani";
      const favNum1 = "14";
      await simple_storage.addPerson(favNum1, name1);
      // Second entry.
      const name2 = "Andrew";
      const favNum2 = "8";
      await simple_storage.addPerson(favNum2, name2);

      const personAdded = await simple_storage.people(1);
      assert.equal(personAdded[0].toString(), favNum2);
      assert.equal(personAdded[1].toString(), name2);
    });
  });
});
