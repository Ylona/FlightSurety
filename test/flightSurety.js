
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

  });

  // it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
  //
  //     await config.flightSuretyData.setOperatingStatus(false);
  //
  //     let reverted = false;
  //     try
  //     {
  //         await config.flightSurety.setTestingMode(true);
  //     }
  //     catch(e) {
  //         reverted = true;
  //     }
  //     assert.equal(reverted, true, "Access not blocked for requireIsOperational");
  //
  //     // Set it back for other tests to work
  //     await config.flightSuretyData.setOperatingStatus(true);
  //
  // });

  it('First airline is registered when contract is deployed.', async () => {

    let result = await config.flightSuretyData.isAirline.call(config.firstAirline);

    // ASSERT
    assert.equal(result, true, "First airline should be register when contract is deployed");

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
        await config.flightSuretyApp.registerAirline(newAirline, "Airline 2", {from: config.firstAirline});
    }
    catch(e) {

    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

  });

  it('(airline) can register an Airline using registerAirline() if it is funded', async () => {

    // ARRANGE
    let newAirline = accounts[3];
    let funding = web3.utils.toWei("10", "ether");

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {from: config.firstAirline});
      await config.flightSuretyApp.payRegistrationFee("Airline 3",{ from: newAirline, value: funding });

    }
    catch(e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isAirline.call(newAirline);

    // ASSERT
    assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

  });

  it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

    let funding = web3.utils.toWei("10", "ether");

    assert.equal(await config.flightSuretyData.isAirline.call(accounts[0]), true, "Airline should be able to register another airline if it has provided funding");
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[3]), true, "Airline should be able to register another airline if it has provided funding");
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), false, "Airline should be able to register another airline if it has provided funding");

    await config.flightSuretyApp.registerAirline(accounts[4], {from: config.firstAirline});
    await config.flightSuretyApp.payRegistrationFee("Airline 4", { from: accounts[4], value: funding });
    await config.flightSuretyApp.registerAirline(accounts[5], {from: accounts[3]});
    await config.flightSuretyApp.payRegistrationFee("Airline 5", { from: accounts[5], value: funding });

    assert.equal(await config.flightSuretyData.isAirline.call(accounts[4]), true, "Airline should be able to register another airline if it has provided funding");
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[5]), true, "Airline should be able to register another airline if it has provided funding");

    await config.flightSuretyApp.payRegistrationFee("Airline 6",{ from: accounts[6], value: funding });
    await config.flightSuretyApp.registerAirline(accounts[6], {from: config.firstAirline});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), false, "Airline cannot register when only one party consent");
    await config.flightSuretyApp.registerAirline(accounts[6], {from: accounts[3]});
    assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]), true, "Airline should be able to register with multi party consensus");
  });


});
