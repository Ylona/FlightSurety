var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

contract('Flight Surety Tests', async (accounts) => {

  var config;
  const TEST_ORACLES_COUNT = 20;
  const STATUS_CODE_UNKNOWN = 0;
  const STATUS_CODE_ON_TIME = 10;
  const STATUS_CODE_LATE_AIRLINE = 20;
  const STATUS_CODE_LATE_WEATHER = 30;
  const STATUS_CODE_LATE_TECHNICAL = 40;
  const STATUS_CODE_LATE_OTHER = 50;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
        config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`,
      async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

      });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`,
      async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
          await config.flightSuretyData.setOperatingStatus(false,
              {from: config.testAddresses[2]});
        } catch (e) {
          accessDenied = true;
        }
        assert.equal(accessDenied, true,
            "Access not restricted to Contract Owner");

      });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`,
      async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
          await config.flightSuretyData.setOperatingStatus(false);
        } catch (e) {
          accessDenied = true;
        }
        assert.equal(accessDenied, false,
            "Access not restricted to Contract Owner");

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

    let result = await config.flightSuretyData.isAirline.call(
        config.firstAirline);

    // ASSERT
    assert.equal(result, true,
        "First airline should be register when contract is deployed");

  });

  it('(airline) cannot register an Airline using registerAirline() if it is not funded',
      async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        try {
          await config.flightSuretyApp.registerAirline(newAirline, "Airline 2",
              {from: config.firstAirline});
        } catch (e) {

        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, false,
            "Airline should not be able to register another airline if it hasn't provided funding");

      });

  it('(airline) can register an Airline using registerAirline() if it is funded',
      async () => {

        // ARRANGE
        let newAirline = accounts[3];
        let funding = web3.utils.toWei("10", "ether");

        // ACT
        try {
          await config.flightSuretyApp.registerAirline(newAirline,
              {from: config.firstAirline});
          await config.flightSuretyApp.payRegistrationFee("Airline 3",
              {from: newAirline, value: funding});

        } catch (e) {
          console.log(e);
        }
        let result = await config.flightSuretyData.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, true,
            "Airline should be able to register another airline if it has provided funding");

      });

  it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines',
      async () => {

        let funding = web3.utils.toWei("10", "ether");

        assert.equal(await config.flightSuretyData.isAirline.call(accounts[0]),
            true,
            "Airline should be able to register another airline if it has provided funding");
        assert.equal(await config.flightSuretyData.isAirline.call(accounts[3]),
            true,
            "Airline should be able to register another airline if it has provided funding");
        assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]),
            false,
            "Airline should be able to register another airline if it has provided funding");

        await config.flightSuretyApp.registerAirline(accounts[4],
            {from: config.firstAirline});
        await config.flightSuretyApp.payRegistrationFee("Airline 4",
            {from: accounts[4], value: funding});
        await config.flightSuretyApp.registerAirline(accounts[5],
            {from: accounts[3]});
        await config.flightSuretyApp.payRegistrationFee("Airline 5",
            {from: accounts[5], value: funding});

        assert.equal(await config.flightSuretyData.isAirline.call(accounts[4]),
            true,
            "Airline should be able to register another airline if it has provided funding");
        assert.equal(await config.flightSuretyData.isAirline.call(accounts[5]),
            true,
            "Airline should be able to register another airline if it has provided funding");

        await config.flightSuretyApp.payRegistrationFee("Airline 6",
            {from: accounts[6], value: funding});
        let result = await config.flightSuretyData.getAllAirline();
        assert.equal(result.length, 5,
            "Airline should be able to register with multi party consensus");
        await config.flightSuretyApp.registerAirline(accounts[6],
            {from: config.firstAirline});
        assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]),
            false, "Airline cannot register when only one party consent");
        await config.flightSuretyApp.registerAirline(accounts[6],
            {from: accounts[3]});
        assert.equal(await config.flightSuretyData.isAirline.call(accounts[6]),
            true,
            "Airline should be able to register with multi party consensus");
        result = await config.flightSuretyData.getAllAirline();
        assert.equal(result.length, 5,
            "Airline should be able to register with multi party consensus");

      });

  it('Get All airlines.', async () => {

    let result = await config.flightSuretyData.getAllAirline();

    // ASSERT
    assert.equal(result[0].name, "First Airline inc.",
        "First address should be 0x627306090abaB3A6e1400e9345bC60c78a8BEf57\n");
  });

  it('Airline can register flights and see all flights.', async () => {

    await config.flightSuretyApp.registerFlight("EA0001", 1644222794);
    await config.flightSuretyApp.registerFlight("EA0002", 1644222794);

    let result = await config.flightSuretyData.getAllFlights();

    try {
      await config.flightSuretyApp.registerFlight("EA0003", 1644222794,
          {from: accounts[10]});
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Only airlines can register flights");

    // ASSERT
    assert.equal(result[0].name, "EA0001",
        "First flight should be named EA0001");
    assert.equal(result[1].name, "EA0002",
        "Second flight should be named EA0002");
    assert.equal(result[2], null, "Thirs flight should not be registered");

  });

  it('can register oracles', async () => {

    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();


    // ACT
    for(let a=20; a<20+TEST_ORACLES_COUNT; a++) {
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
    }
  });

  it('can request flight status', async () => {

    // ARRANGE
    let flight = 'ND1309'; // Course number
    let timestamp = Math.floor(Date.now() / 1000);

    // Submit a request for oracles to get status information for a flight
    await config.flightSuretyApp.registerFlight(flight, timestamp, {from: config.firstAirline});
    await config.flightSuretyApp.fetchFlightStatus(config.firstAirline, flight, timestamp);

    // ACT

    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a=20; a<20+TEST_ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});

      console.log(`Oracle Registered: ${oracleIndexes[0]}, ${oracleIndexes[1]}, ${oracleIndexes[2]}`);

      for(let idx=0;idx<3;idx++) {

        try {
          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
          console.log("worked");
        }
        catch(e) {
          // Enable this when debugging
          console.log(e);
          console.log('\nError', idx, oracleIndexes[idx].toNumber(), flight, timestamp);
        }

      }
    }
    console.log(await config.flightSuretyData.getAllFlights());


  });

});
