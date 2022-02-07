pragma solidity ^0.4.25;
pragma experimental ABIEncoderV2;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../node_modules/@nomiclabs/buidler/console.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    struct Profile {
        string name;
        bool isAirline;
        bool acceptedByOtherAirlines;
        bool hasPayedFund;
    }

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => Profile) airlines;      // Mapping for storing airlines
    address[] registeredAirlines = new address[](0);
    mapping(address => address[]) multipartyConsensusNewAirline;         // Mapping from a potential airline to airlines that gave consensus
    uint256 public constant MIN_FUND = 10 ether; //minimum fund required to participate in contract


    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        airlines[msg.sender] = Profile({
        name: "First Airline inc.",
        isAirline: true,
        acceptedByOtherAirlines: true,
        hasPayedFund: false
        });
        registeredAirlines.push(msg.sender);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireIsAirline()
    {
        // Modify to call data contract's status
        require(airlines[msg.sender].isAirline, "Caller is no registered airline");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Check if an airline is registered
    *
    * @return A bool that indicates if the airline is registered
    */
    function isAirline
    (
        address wallet
    )
    external
    view
    returns (bool)
    {
        return airlines[wallet].isAirline;
    }

    function getAirline
    (
        address wallet
    )
    external
    view
    returns (Profile memory)
    {
        return airlines[wallet];
    }


    function getNumberOfRegisteredAirlines
    (
    )
    external
    view
    returns (uint256)
    {
        return registeredAirlines.length;
    }

    function getConsendingAirlines
    (
    address wallet
    )
    external
    view
    returns (address[] memory)
    {
        return multipartyConsensusNewAirline[wallet];
    }

    function resetConsendingAirlines(address newAirline ) external {
        multipartyConsensusNewAirline[newAirline] = new address[](0);
    }

    function addConsendingAirlines(address newAirline, address existingAirline) external {
        multipartyConsensusNewAirline[newAirline].push(existingAirline);
    }

    function updateAirlineAcceptedByOtherAirlines(address wallet, bool hasConsensus)
    external  returns (bool) {
        airlines[wallet].acceptedByOtherAirlines = hasConsensus;
        return checkIfQualifiesForAirline(wallet);
    }

    function updateAirlineNameAndHasPayedFund(address wallet, string name, bool hasPayedFund)
    external  {
        airlines[wallet].name = name;
        airlines[wallet].hasPayedFund = true;

        checkIfQualifiesForAirline(wallet);
    }

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function checkIfQualifiesForAirline(address wallet) internal returns (bool){
        if(airlines[wallet].acceptedByOtherAirlines && airlines[wallet].hasPayedFund){
            airlines[wallet].isAirline = true;
            registeredAirlines.push(wallet);
            return true;
        }
        return false;
    }


   /**
    * @dev Buy insurance for a flight
    *
    */   
    function buy
                            (                             
                            )
                            external
                            payable
    {

    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                )
                                external
                                pure
    {
    }
    

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
    */
    function pay
                            (
                            )
                            external
                            pure
    {
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            (   
                            )
                            public
                            payable
    {
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    function authorizeCaller( address caller) external pure {

    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

