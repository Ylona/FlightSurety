import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

let config = Config['localhost'];
let web3 = new Web3(
    new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi,
    config.appAddress);

let oracles = [];
let oracleIndexDict = {};
var START_ORACLE_ADDRESS = 10, NUMBER_OF_ORACLES = 20;

web3.eth.getAccounts((error, accts) => {
  if (accts < START_ORACLE_ADDRESS + NUMBER_OF_ORACLES) {
    console.log("There are not enough account for the needed amount of oracles")
    return;
  }

  for (let i = START_ORACLE_ADDRESS; i < START_ORACLE_ADDRESS + NUMBER_OF_ORACLES; i++) {
    console.log(`Registering ${accts[i]} : ${web3.utils.toWei('1', "ether")}`)
    flightSuretyApp.methods.registerOracle().send({
      "from": accts[i],
      "value": web3.utils.toWei('1', "ether"),
      "gas": 5000000,
      "gasPrice": 100000000000
    }).then(result => {
      oracles.push(accts[i]);
      console.log(`${accts[i]} registered as oracle`);
    }).catch(err => {
      console.log(`${accts[i]}: ${err}`);

    })
  }
  setTimeout(() => {  console.log("World!");

  console.log("All oracles are registered")
  console.log(oracles);

  oracles.forEach(oracle => {
    flightSuretyApp.methods.getMyIndexes().call({
      "from": oracle,
      "gas": 5000000,
      "gasPrice": 100000000000
    }).then(result => {
      console.log(result);
      console.log(`Oracle ${oracle}: ${result[0]}, ${result[1]}, ${result[2]}`)
      oracleIndexDict[oracle] = result;
    }).catch(err => {
      console.log(`Oracle ${oracle}: ${err}`)
    })
  })
  }, 20000);
});

console.log("Start to listen to request events...")

flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) {
    console.log("error: " + error)
  }
  let result = event['returnValues'];

  let index = result['index'];
  let flight = result['flight'];
  let airline = result['airline'];
  let timestamp = result['timestamp'];

  oracles.forEach(oracle => {
    if (oracleIndexDict[oracle][0] === index || oracleIndexDict[oracle][1]
        === index || oracleIndexDict[oracle][2] === index) {
      let status = Math.floor(Math.random() * 6) * 10;
      flightSuretyApp.methods
      .submitOracleResponse(index, airline, flight, timestamp, status).send({
        "from": oracle,
        "gas": 5000000,
        "gasPrice": 100000000000
      }).then(result => {
        console.log(`Oracle ${oracle}: - Flight ${flight} status: ${status}`);
      }).catch(error => {
        console.log(`Oracle ${oracle}: ' + ${error}`)
      });
    }
  });

});

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;


