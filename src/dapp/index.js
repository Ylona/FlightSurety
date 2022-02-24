
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        //var airlines = DOM.elid("airlines-content");
        //var flights = DOM.elid("flights-content");

        let tabs = ["airlines-tab", "flights-tab", "passenger-tab"].map(item => {
            return DOM.elid(item);
        });
        let content = ["airlines-content", "flights-content", "passenger-content"].map(item => {
            return DOM.elid(item);
        });

        tabs.forEach((tab, i, element) => {
            tab.addEventListener('click', () => {
                element.forEach((i, j, htmlElement) => {
                    i.classList.remove("active");
                    content[j].style.display = "none";
                });
                tab.classList.add("active");
                content[i].style.display = "block";
            });
        });
        // User-submitted transaction
        DOM.elid('nominate').addEventListener('click', () => {
            let address = DOM.elid('nomidate-address').value;
            // Write transaction
            contract.registerAirline(address).then(function (result) {
                console.log(result);
            })
            updateUI(contract)

        })

        DOM.elid('vote').addEventListener('click', () => {
            // Write transaction
            let address = DOM.elid('potential-airline').value;
            console.log(address);
            contract.registerAirline(address).then(function (result) {
                console.log(result);
            })
            updateUI(contract)
        })

        DOM.elid('fund').addEventListener('click', () => {
            // Write transaction
            let name = DOM.elid('airline-name').value;
            contract.payRegistrationFee(name).then(function (result) {
                console.log(result);
            })
            updateUI(contract)
        })

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });

        contract.isAirlineRegistered((error, result) => {
            console.log(error,result);
            display('Logged in as airline', 'Check if user is airline', [ { label: 'is Airline', error: error, value: result} ]);
        });

        updateUI(contract)

        // User-submitted transaction
        DOM.elid('submit-flight').addEventListener('click', () => {
            let flight = DOM.elid('flight-name').value;
            // Write transaction
            contract.registerFlight(flight, (error, result) => {
                display('Flights', 'Flight registerd', [ { label: 'Flight', error: error, value: result} ]);
            });
        })
    

        // // User-submitted transaction
        // DOM.elid('submit-oracle').addEventListener('click', () => {
        //     let flight = DOM.elid('flight-number').value;
        //     // Write transaction
        //     contract.fetchFlightStatus(flight, (error, result) => {
        //         display('Oracles', 'Trigger oracles', [ { label: 'Fetch Flight Status', error: error, value: result.flight + ' ' + result.timestamp} ]);
        //     });
        // })



    });
    

})();

function updateUI(contract) {
    contract.getAllAirline().then(function (result) {
        displayAirlineTable("Airlines", result);
        displayPotentialAirlines("Airlines", result);
    });
    console.log("test");
    contract.getAllFlights().then(function (result) {
        console.log("flights");
        console.log(result);
        displayFlightTable("Flights", result, contract);
    });
}

function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayFlightTable(title, results, contract) {
    let rows = DOM.elid("flight-rows");
    results.map((result) => {
        console.log(result)
        let row = DOM.tr();
        row.appendChild(DOM.th({scope :'col'}, result["name"]));
        row.appendChild(DOM.th({scope :'col'}, result["updatedTimestamp"]));
        row.appendChild(DOM.th({scope :'col'},  String(result["statusCode"])));

        let button = DOM.button({
            className: 'btn btn-primary my-1',
            type: 'submit',
            id: `${result["name"]}`
        },"Get flight status");
        row.appendChild(DOM.th({scope :'col'}, button));

        // console.log(result);
        // let row = section.appendChild(DOM.div({className:'row'}));
        // row.appendChild(DOM.div({className: 'col-sm-2 field'}, result["name"]));
        // row.appendChild(DOM.div({className: 'col-sm-5 field'}, result["updatedTimestamp"]));
        // row.appendChild(DOM.div({className: 'col-sm-1 field'}, String(result["statusCode"])));
        // row.appendChild(DOM.div({className: 'col-sm-1 field'}, "test"));
        rows.appendChild(row);

        DOM.elid(result["name"]).addEventListener('click', () => {
            // Write transaction
            contract.fetchFlightStatus(result["airline"], result["name"], result["updatedTimestamp"]).then(function (result) {
                console.log(result);
            })
        })
    })
}

function displayAirlineTable(title, results) {
    let displayDiv = DOM.elid("display-airline-table");
    let section = DOM.section();
    section.appendChild(DOM.h2({className: 'center'}, title));
    let row = section.appendChild(DOM.div({className:'row'}));
    row.appendChild(DOM.div({className: 'col-sm-2 field'}, "Airline name"));
    row.appendChild(DOM.div({className: 'col-sm-5 field'}, "Wallet address"));
    row.appendChild(DOM.div({className: 'col-sm-1 field'}, "Accepted"));
    row.appendChild(DOM.div({className: 'col-sm-1 field'}, "Funded"));
    section.appendChild(row);

    results.map((result) => {
        console.log(result);
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-2 field'}, result["name"]));
        row.appendChild(DOM.div({className: 'col-sm-5 field'}, result["wallet"]));
        row.appendChild(DOM.div({className: 'col-sm-1 field'}, String(result["acceptedByOtherAirlines"])));
        row.appendChild(DOM.div({className: 'col-sm-1 field'}, String(result["hasPayedFund"])));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displayPotentialAirlines(title, results){
    let dropDownList = DOM.elid("potential-airline");
    results.map((result) => {
        if(!result["acceptedByOtherAirlines"]){
            let el = document.createElement("option");
            let airlineName = result["name"];
            let airelineAddress = result["wallet"]
            el.text = `${airlineName}  (${airelineAddress})`;
            el.value = `${airelineAddress}`;
            dropDownList.appendChild(el);
        }
    })
}








