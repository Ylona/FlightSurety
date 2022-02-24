import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
const TruffleContract = require("@truffle/contract");


export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        // this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        // this.flightSuretyData= new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

        let provider = new Web3.providers.HttpProvider(config.url);

        this.web3 = new Web3(provider);

        this.flightSuretyApp = TruffleContract(FlightSuretyApp);
        this.flightSuretyApp.setProvider(provider);

        this.flightSuretyData = TruffleContract(FlightSuretyData);
        this.flightSuretyData.setProvider(provider);

        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    async initialize(callback) {
        await window.ethereum.enable();
        await this.web3.eth.getAccounts((error, accts) => {

            this.owner = accts[0];

            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(accts[counter++]);
            }

            while (this.passengers.length < 5) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }

    async getContractInstance(){
        return await this.flightSuretyApp.deployed();
    }

    async getDataContractInstance(){
        return await this.flightSuretyData.deployed();
    }

    async isOperational() {
        let instance = await this.getContractInstance();
        return await instance.isOperational({from: this.owner});
    }

    async isAirlineRegistered() {
        let instance = await this.getContractInstance();
        return await instance.isAirlineRegistered({from: this.owner});
    }

    async registerAirline(newAirline) {
        let instance = await this.getContractInstance();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        let caller = accounts[0];
        return await instance.registerAirline(newAirline, {from: caller});
    }

    async payRegistrationFee(name) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        let caller = accounts[0];
        let instance = await this.getContractInstance();
        let fundPrice = this.web3.utils.toWei('10', "ether");
        return await instance.payRegistrationFee(name, {from: caller, value: fundPrice});
    }

    async getAllAirline() {
        let instance = await this.getDataContractInstance();
        return await instance.getAllAirline();
    }

    async getAllFlights() {
        let instance = await this.getDataContractInstance();
        return await instance.getAllFlights();
    }

    async registerFlight(name) {
        let instance = await this.getContractInstance();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        let caller = accounts[0];
        return await instance.registerFlight(name, 1644222794, {from: caller});
    }

    async fetchFlightStatus(airline, flight, timestamp) {
        let instance = await this.getContractInstance();
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        let caller = accounts[0];
        return await instance.fetchFlightStatus(airline, flight, timestamp, {from: caller});
    }
}