// Functions declarations

// Purges the session if new request. Handles history on reload.
const handleSessionOnReload = () => {

    if (document.cookie.indexOf('_s') === -1) {
        console.log('Session purged');
        sessionStorage.clear();
    }
    
    console.log(window.performance.navigation.type);
    if (window.performance.navigation.type === 1) {

        // Values that need to be set when user reloads the page
        pageReloaded = true;
        historyOp = 'none'; 

        let historyOnReload = sessionStorage.getItem('pageStatus');
        sessionStorage.removeItem('pageStatus');

        historyOnReload = JSON.parse(historyOnReload);

        if (historyOnReload) {
            // We don't need this to clear total states and the rest of details (empty, initial, so on)
            let totalStatesOnReload = historyOnReload.totalStates;
            
            if (totalStatesOnReload && Array.isArray(totalStatesOnReload) && totalStatesOnReload.length > 0) {
    
                // Calculates current states and based on this, pages visited 
                let pagesVisited = 
                    totalStatesOnReload.filter(currentState => currentState.page > 0).length +    
                                    totalStatesOnReload.filter(currentState => {
                                        let currentHistoryPage = window.history.state && window.history.state.page ? window.history.state.page : 0;
                                        return currentState.page <= currentHistoryPage;
                                    }).map(de => {
                                        return de.state.filter((currentState, index) => {
                                            if (de.page < window.history.state.page) {
                                                return index <= de.state.length - 1;
                                            } else {
                                                let currentStateIndex = window.history.state && window.history.state.state && !isNaN(window.history.state.state) ? window.history.state.state : 0;
                                                return index <= currentStateIndex;
                                            }
                                            
                                        }).length;
                                    }).reduce((acc, curr) => acc + curr);

                // Returns back as much as pages visited, so gets to initial state 
                window.history.go(-(pagesVisited));  
            }
        }

        window.history.replaceState({ page: 0, state: 'back' }, window.location.href, window.location.href);
        sessionStorage.clear();

    }

}

// Get filter current status
const getEnabledFilters = () => {   
    return {
        city: byCitySelected,
        salary: bySalarySelected,
        qualification: byQualificationSelected
    };
}

// Controls dynamic changes on status panel
const handleStatusIndicatorsStatus = () => {

    if (byCitySelected || bySalarySelected || byQualificationSelected) {
        statusIndicatorsContainer.style.display = 'flex';
        buttonAndStatusContainer.style.marginBottom = '5px';
    } else {
        statusIndicatorsContainer.style.display = 'none';
        buttonAndStatusContainer.style.marginBottom = '20px';
    }

    if (byCitySelected) enabledCity.style.opacity = '1'; else enabledCity.style.opacity = '0';
    if (bySalarySelected) enabledSalary.style.opacity = '1'; else enabledSalary.style.opacity = '0';
    if (byQualificationSelected) enabledQualification.style.opacity = '1'; else enabledQualification.style.opacity = '0';
    
}

// Executes filtering request
const triggerFilterRequest = () => {

    let xmlHttpRequest;

    if (window.XMLHttpRequest) {
        xmlHttpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        xmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    }

    let filters;
    xmlHttpRequest.onreadystatechange = () => {
        filters = {
            'city' : byCitySelected,
            'salary': bySalarySelected,
            'qualification': byQualificationSelected
        };
    };

    xmlHttpRequest.open('POST', '/file-manager/render', true);

    if (xmlHttpRequest.readyState > 0) {
        xmlHttpRequest.setRequestHeader('Content-Type', 'application/json');
    }

    xmlHttpRequest.send(JSON.stringify(filters));

    xmlHttpRequest.onload = () => {
        if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 201) {
            const response = JSON.parse(xmlHttpRequest.responseText);

            // Global variables for html generation
            let container = document.querySelectorAll('div.dv-lvl-1.recruiter-result-items-container')[0];;
            let lastCity;
            let infoModelItemNode = document.querySelectorAll('div.dv-lvl-2.recruiter-result-item')[0];
            let modeAndQuantityIndicator = document.querySelectorAll('div.dv-lvl-1.recruiter-result-banner p')[0];
            let quantity = document.querySelectorAll('div.dv-lvl-2.recruiter-result-item').length;

            // Switch for selecting the filtering mode
            
            // 1. city
            // 2. city/salary
            // 3. city/qualification
            // 4. salary
            // 5. qualification
            // 6. initial
            switch (response.mode) {
                case 'city':

                    clearContainerAndSetStatusIndicator(container, modeAndQuantityIndicator, quantity, response.mode);
                    lastCity = 'none';

                    for (const candidate of response.object) {
                        if (candidate.city !== lastCity) {
                            container.innerHTML += "<h2 class=\"he-lvl-2 recruiter-city-item-header\">" + candidate.city + "</h2>";
                        }

                        const newInfoItem = setNewCandidateBox(container, infoModelItemNode, candidate);
                        const showMapNode = setNewShowMapButton(showInMapButtons, candidate);

                        container.appendChild(newInfoItem);
                        container.appendChild(showMapNode);

                        lastCity = candidate.city;
                    }
                    break;
                case 'city/salary':

                    clearContainerAndSetStatusIndicator(container, modeAndQuantityIndicator, quantity, response.mode);

                    for (const cityCandidates of response.object) {

                        let currentCity = Object.keys(cityCandidates).toString();
                        container.innerHTML += "<h2 class=\"he-lvl-2 recruiter-city-item-header\">" + currentCity + "</h2>";

                        for (const cityCandidate of cityCandidates[currentCity]) {
                            const newInfoItem = setNewCandidateBox(container, infoModelItemNode, cityCandidate);
                            const showMapNode = setNewShowMapButton(showInMapButtons, cityCandidate);

                            container.appendChild(newInfoItem);
                            container.appendChild(showMapNode);
                        }

                    }
                    break;
                case 'city/qualification':

                    clearContainerAndSetStatusIndicator(container, modeAndQuantityIndicator, quantity, response.mode);

                    for (const cityCandidates of response.object) {

                        let currentCity = Object.keys(cityCandidates).toString();
                        container.innerHTML += "<h2 class=\"he-lvl-2 recruiter-city-item-header\">" + currentCity + "</h2>";

                        for (const cityCandidate of cityCandidates[currentCity]) {
                            const newInfoItem = setNewCandidateBox(container, infoModelItemNode, cityCandidate);
                            const showMapNode = setNewShowMapButton(showInMapButtons, cityCandidate);

                            container.appendChild(newInfoItem);
                            container.appendChild(showMapNode);
                        }
                    }
                    break;
                case 'salary':
                case 'qualification':
                case 'initial':

                    clearContainerAndSetStatusIndicator(container, modeAndQuantityIndicator, quantity, response.mode);

                    for (const candidate of response.object) {
                        const newInfoItem = setNewCandidateBox(container, infoModelItemNode, candidate);
                        const showMapNode = setNewShowMapButton(showInMapButtons, candidate);

                        container.appendChild(newInfoItem);
                        container.appendChild(showMapNode);
                    }

                    break;

                default:
                    console.log('No filters selected');  
                    break;
            }
            showInMapButtons = document.querySelectorAll('div.dv-lvl-2.show-in-map');
            setOnShowMapClickEvents();

        }
    }

};

// Handles actions on clicks
const handleFilterClick = (e) => {

    // Remove items from total states if higher than current index (history updated)
    totalStates = totalStates.filter((currentState, index) => index <= page);

    let stateBeforeClick = window.history.state.state;
    state = window.history.state && window.history.state.state !== undefined && window.history.state.state !== null && window.history.state.state !== 'initial' && !isNaN(window.history.state.state) ? window.history.state.state + 1 : 0;
    state = currentPageStates.state.length === 0 && totalStates[page] && Array.isArray(totalStates[page].state) && totalStates[page].state.length > 0 
        ? 1
        : state;
    let statesForPage = totalStates.find(currentState => currentState.page === window.history.state.page);
    if ((statesForPage && statesForPage.state && Array.isArray(statesForPage.state) && statesForPage.state.length - stateBeforeClick) > 1) {
        // Replacing
        console.log('Replacing existing state')
        state++;
        window.history.forward();
        
        // Rest of the code need to be done on onpopstate event: page state is not updated yet, so value is not correct
        historyOp = 'replace';
    } else {
        // Pushing
        console.log('Pushing new state on click');
        window.history.pushState({ page: page, state: state }, window.location.href, window.location.href);
        historyOp = 'regular';
    }
    
    firstLoading = false;

    const buttonKeys = ['city', 'salary', 'qualification'];

    buttonKeys.forEach(currentKey => {
        if (e.target.className.indexOf('city') > -1) {
            byCitySelected = !byCitySelected;
        }

        if (e.target.className.indexOf('salary') > -1) {
            bySalarySelected = !bySalarySelected;
            byQualificationSelected = false;
        }

        if (e.target.className.indexOf('qualification') > -1) {
            byQualificationSelected = !byQualificationSelected;
            bySalarySelected = false;
        }
    });

    switch (historyOp) {
        case 'regular': 
            currentPageStates.page = page;

            if (currentPageStates.state.length === 0 && totalStates[page] && Array.isArray(totalStates[page].state) && totalStates[page].state.length > 0) {
                currentPageStates.state = totalStates[page].state.concat([getEnabledFilters()]);
            } else {
                currentPageStates.state.push(getEnabledFilters());
            }
            
            totalStates[page] = currentPageStates;
            break;
        case 'replace': 
            statesForPage.state[state - 1] = getEnabledFilters();
            break;
    }
    
    handleStatusIndicatorsStatus();
    triggerFilterRequest();
};

// Controls qualification panel color changes
const handleQualificationColor = (qualification, element) => {
    if (parseInt(qualification) >= 8) {
        if (element.classList.value.match(/\s?(green|red|yellow){1,}/g,)) {
            const textToReplace = element.classList.value.match(/\s?(green|red|yellow){1,}/g,).toString();
            element.classList.remove(textToReplace.trim());
        }
        element.classList.add('green');
    } else if (parseInt(qualification) >= 5 && parseInt(qualification) < 8) {
        if (element.classList.value.match(/\s?(green|red|yellow){1,}/g,)) {
            const textToReplace = element.classList.value.match(/\s?(green|red|yellow){1,}/g,).toString();
            element.classList.remove(textToReplace.trim());
        }
        element.classList.add('yellow');
    } else {
        if (element.classList.value.match(/\s?(green|red|yellow){1,}/g,)) {
            const textToReplace = element.classList.value.match(/\s?(green|red|yellow){1,}/g,).toString();
            element.classList.remove(textToReplace.trim());
        }
        element.classList.add('red');
    }
}

// Set the actions to be triggered on clicks events
const setOnShowMapClickEvents = () => {

    showInMapButtons.forEach(showInMapButton => {
        showInMapButton.onclick = (e) => {

            let clickedButtonClassName = e.path.find(element => element.className.startsWith('dv-lvl-2 show-in-map')).className;
            let userId = parseInt(clickedButtonClassName.split('r-')[1]);

            let totalStatesLength = 0;
            totalStates.forEach(currentState => totalStatesLength += currentState.state ? currentState.state.length : 0);

            console.log('Checking total length for states at page is correct: ' + totalStatesLength);
            sessionStorage.setItem('pageStatus', JSON.stringify({
                totalStates: totalStates,
                lastSavedPage: { page: page, totalStates: totalStatesLength }
            }));

            window.location = '/file-manager/map/' + userId;

        };
    });
}

// Clears full container and set status indicator on each filtering
const clearContainerAndSetStatusIndicator = (container, indicator, quantity, responseMode) => {
    
    if (responseMode.indexOf('/') > -1) {
        responseMode = responseMode.replace('/', ' and ');
    }

    container.innerHTML = '';

    if (responseMode !== 'initial') {
        indicator.innerText = 'Showing results: ' + quantity + '. Ordered by ' + responseMode;
    } else {
        indicator.innerText = 'Showing results: unordered';
    }
    
}

// Sets the content for each candidate info panel when filtering
const setNewCandidateBox = (container, infoModelItemNode, candidate) => {
    let newInfoItem = document.createElement("div")
    newInfoItem.className = infoModelItemNode.className + ' city-filtered-' + candidate.id;
    newInfoItem.innerHTML = infoModelItemNode.innerHTML;
    let nameNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-name')[0];
    let surnameNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-surname')[0];
    let emailNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-mail')[0];
    let phoneNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-phone')[0];
    let ageNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-age')[0];
    let salaryNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-salary')[0];
    let qualificationNode = newInfoItem.querySelectorAll('div.' + newInfoItem.className.replace(/\s/g, ".") + ' p.p-qualification')[0];
    
    const cityClassNameRegExpString = newInfoItem.className.match(/([\s]?city-filtered-[0-9]){1,}/g).toString();
    newInfoItem.className = newInfoItem.className.replaceAll(new RegExp(cityClassNameRegExpString, 'g'), '');

    nameNode.innerText = nameNode.innerText.substring(0, nameNode.innerText.indexOf(' ')) + ' ' + candidate.name;
    surnameNode.innerText = surnameNode.innerText.substring(0, surnameNode.innerText.indexOf(' ')) + ' ' + candidate.surname;
    emailNode.innerText = emailNode.innerText.substring(0, emailNode.innerText.indexOf(' ')) + ' ' + candidate.mail;
    phoneNode.innerText = phoneNode.innerText.substring(0, phoneNode.innerText.indexOf(' ')) + ' ' + candidate.phone;
    ageNode.innerText = ageNode.innerText.substring(0, ageNode.innerText.indexOf(' ')) + ' ' + candidate.age;
    salaryNode.innerText = salaryNode.innerText.substring(0, salaryNode.innerText.indexOf(' ')) + ' ' + candidate.salary;
    qualificationNode.innerText = candidate.qualification;

    handleQualificationColor(candidate.qualification, qualificationNode.parentElement);

    return newInfoItem;
}

// Sets the button to current candidate map when filtering
const setNewShowMapButton = (showInMapButtons, candidate) => {
    let showMapIndex = 0;
    showInMapButtons.forEach(
        (currentShowMapNode, index) => {
            if (candidate.id === parseInt(currentShowMapNode.className.split('r-')[1])) {
                showMapIndex = index;
            }
        });
    let showMapNode = showInMapButtons[showMapIndex];
    return showMapNode;
}

// Ads 10 length aleatory hash to base64 encoded cookie
const addAleatoryHash = () => {
    let hash = '';

    const options = {
        numbers : {
            min: 48,
            max: 58
        },
        upper: {
            min: 65,
            max: 91
        },
        lower: {
            min: 97,
            max: 123
        }
    };


    for (let i = 0; i < 10; i++) {
        const chars = ['numbers', 'upper', 'lower'];
        let index = Math.floor(Math.random() * 3);
        let max = options[chars[index]].max; 
        let min = options[chars[index]].min;
        let asciiCode = Math.floor(Math.random() * (max - min) + min);
        let nextChar = String.fromCharCode(asciiCode);
        hash += nextChar;
    }
    return hash;
}

// Sets the cookie to authorize request
const setSecurityCookie = () => {
    let payload = 'encodehere==' + addAleatoryHash();
    var currentTime = new Date();
    let newDate = currentTime.setSeconds(currentTime.getSeconds() + 2);
    let newDateObject = new Date(newDate);
    document.cookie = '_p=' + payload + ';' + 'path=/file-manager; samesite=strict; expires=' + newDateObject.toGMTString();
}

// Sets the cookie to handle session storage
const setSessionStorageCookie = () => {
    var currentTime = new Date();
    let newDate = currentTime.setSeconds(currentTime.getSeconds() + 2);
    let newDateObject = new Date(newDate);
    document.cookie = '_s=true; path=/file-manager; samesite=strict; expires=' + newDateObject.toGMTString();
    
}

// Set the previous states when going back on history   
const setPreviousStates = () => {
    
    if (totalStates && totalStates.length > 0) {
        
        let pagePosition = window.history.state.page;
        let lastPageStates;
        
        while (pagePosition >= 0 && !lastPageStates) {
            if (!lastPageStates) {
                lastPageStates = totalStates.find(currentState => currentState.page === pagePosition);
            }
            pagePosition--;
        }

        let lastFilteredState = state === 'initial' ? lastPageStates.state[0] : lastPageStates.state[lastPageStates.state.length - 1];
        byCitySelected = lastFilteredState.city;
        bySalarySelected = lastFilteredState.salary;
        byQualificationSelected = lastFilteredState.qualification;
        handleStatusIndicatorsStatus();

    } else {
        handleStatusIndicatorsStatus();
    }
    
}

// Set the color for qualifications on first load
const setQualificationPanelsColors = () => {
    if (firstLoading) {
        const currentItems = document.querySelectorAll('div.dv-lvl-2.recruiter-result-item');
        for (const candidate of currentItems) {
            const qualificationBackgroundNode = candidate.querySelectorAll('div.dv-lvl-3.recruiter-result-item-qualification')[0];
            const qualification = candidate.querySelectorAll('p.p-qualification')[0].innerText;
            handleQualificationColor(qualification, qualificationBackgroundNode);
        }
    } 
}

// Bind actions to be triggered on filters clicks
const bindActionsToEvents = () => { 
    if (byCityButton && bySalaryButton && byQualificationButton) {
        byCityButton.onclick = (e) => handleFilterClick(e);
        bySalaryButton.onclick = (e) => handleFilterClick(e);
        byQualificationButton.onclick = (e) => handleFilterClick(e);
    } else {
        throw new Error('Error with buttons. Check structure');
    }
}

// Inits whole process
const init = () => {
    bindActionsToEvents();
    setPreviousStates();
    setQualificationPanelsColors();
    setOnShowMapClickEvents();
}

// Pre-script necessary code
let pageReloaded = false;
let historyOp = '';
handleSessionOnReload();

// Script and global variables declaration
// Clean security cookie
document.cookie = "_p= ; expires = Thu, 01 Jan 1970 00:00:00 GMT";

// Global variables
let currentPageStates = { page: 0, state: [] };
let totalStates = [];
let historyFiltered = false;
let firstLoading = true;
let indexForHistory;
let page = 0;
let state = window.history.state && window.history.state.state === 'back' ? 'back' : 'initial';
let windowPrecedence = false;
let byCitySelected = false;
let bySalarySelected = false;
let byQualificationSelected = false;

let history = sessionStorage.getItem('pageStatus');
sessionStorage.removeItem('pageStatus');

// History management
if (history !== null && history !== undefined) {
    history = JSON.parse(history);
    totalStates = !pageReloaded ? history.totalStates : [];
    currentPageStates = !pageReloaded ? currentPageStates : { page: 0, state: [] }
    windowPrecedence = !pageReloaded ? history.windowPrecedence : false;
    page = !pageReloaded ? (window.history.state && window.history.state.page && windowPrecedence ? window.history.state.page : history.lastSavedPage.page) : 0;
    state = window.history.state && window.history.state.state ? window.history.state.state : 'initial';
    
    if (windowPrecedence && window.history.state.page !== history.lastSavedPage.page && !isNaN(window.history.state.page)) {
        // Here we should replace with previous saved state
        console.log('Replacing history page with previous set value: ' + window.history.state.page);
        window.history.replaceState({ page: window.history.state.page, state: state }, window.location.href, window.location.href);
    } else {
        // Here we should push a new state
        console.log('Checking history before pushing new initial object: ' + window.history.state);
        window.history.replaceState({ page: page, state: state }, window.location.href, window.location.href);
    }

    if (page > 0 && state === 'initial') {
        let pagePosition = window.history.state.page;
        let lastPageStates;
        
        while (pagePosition >= 0 && !lastPageStates) {
            if (!lastPageStates) {
                lastPageStates = totalStates.find(currentState => currentState.page === pagePosition);
            }
            pagePosition--;
        }

        if (totalStates.find(currentState => currentState.page === page) === undefined) {
            if (lastPageStates) {
                let initialStateForNewPage = lastPageStates.state[lastPageStates.state.length - 1];
                totalStates.push({ page: page, state: [initialStateForNewPage] });    
            } else {
                console.log('No filters have been pushed to history');
            }
        }
        
    }
    
} else {
    window.history.replaceState({ page: page, state: state }, window.location.href, window.location.href);
}

if (window.history.state.state === 'back') {
    console.log('Clearing history. Resetting initial state');
    window.history.pushState({ page: 0, state: 'initial' }, window.location.href, window.location.href);
}

// Original buttons for filters
const byCityButton = document.querySelectorAll('button.by-city')[0];
const bySalaryButton = document.querySelectorAll('button.by-salary')[0];
const byQualificationButton = document.querySelectorAll('button.by-qualification')[0];

// Show map buttons
let showInMapButtons = document.querySelectorAll('div.dv-lvl-2.show-in-map');

// Necessary elements for handleStatusIndicatorsStatus function
const buttonAndStatusContainer = document.querySelectorAll('div.dv-lvl-2.recruiter-result-button-wrapper')[0];
const statusIndicatorsContainer = document.querySelectorAll('div.dv-lvl-2.recruiter-result-status-wrapper')[0];

const enabledCity = document.querySelectorAll('div.enabled-by-city')[0];
const enabledSalary = document.querySelectorAll('div.enabled-by-salary')[0];
const enabledQualification = document.querySelectorAll('div.enabled-by-qualification')[0];

// Executes initiation
init();

// Onpopstate to be triggered when history changes
window.onpopstate = (e) => {

    console.log('Executing onpopstate');

    if (window.history.state.state === 'back') {
        window.history.back();
    }

    let previousState;
    historyOp = historyOp === '' ? 'regular' : historyOp;

    page = window.history.state && window.history.state.page ? window.history.state.page : 0
    state = window.history.state && window.history.state.state !== null && window.history.state !== undefined ? window.history.state.state : 'initial';

    switch (historyOp) {
        case 'replace':
            window.history.replaceState({ page: page, state: state }, window.location.href, window.location.href);
            historyOp = 'regular';
            break;
        case 'regular':

            if (window.history.state && window.history.state.state !== undefined && window.history.state.state !== null) {
                console.log('From array');
                let pagePosition = window.history.state.page;
                let lastPageStates;
                
                while (pagePosition >= 0 && !lastPageStates) {
                    if (!lastPageStates) {
                        lastPageStates = totalStates.find(currentState => currentState.page === pagePosition);
                    }
                    pagePosition--;
                }

                let index = !isNaN(window.history.state.state) ? window.history.state.state : 0;

                if (page === 0 && state === 'initial') {
                    console.log('Setting initial state');
                    previousState = {
                        city: false,
                        salary: false,
                        qualification: false
                    }
                } else {
                    previousState = lastPageStates.state[index];
                }
                
            }   
            
            break;
        default: 
            break;
    }
    
    if (previousState !== undefined) {
        if (previousState.hasOwnProperty('city') || previousState.hasOwnProperty('salary') || previousState.hasOwnProperty('qualification')) { 
            byCitySelected = previousState.city ? true : false;
            bySalarySelected = previousState.salary ? true : false;
            byQualificationSelected = previousState.qualification ? true : false;

            handleStatusIndicatorsStatus();    
            triggerFilterRequest();
        }

        if (window.history.state && window.history.state.state === 'initial') {
            let totalStatesLength = 0;
            totalStates.forEach(currentState => totalStatesLength += currentState.state.length);
            console.log('Checking total length for states at page is correct: ' + totalStatesLength);

            sessionStorage.setItem('pageStatus', JSON.stringify({
                totalStates: totalStates,
                lastSavedPage: { page: page, totalStates: totalStatesLength },
            }));

        }
        
    }

    // Boolean to reproduce behavior onbeforeunload if onpopstate is not triggered
    historyFiltered = true;

}

// Onbeforeunload to be triggered when unloading every page
window.onbeforeunload = (e) => {

    // Set cookies
    setSecurityCookie();
    setSessionStorageCookie();

    const navigationType = e.currentTarget.performance.navigation.type; 

    if (navigationType !== 1) {

        let pagePosition = window.history.state.page;
        let lastPageStates;
        
        while (pagePosition >= 0 && !lastPageStates) {
            if (!lastPageStates) {
                lastPageStates = totalStates.find(currentState => currentState.page === pagePosition);
            }
            pagePosition--;
        }
        
        const executeOnBeforeUnload = window.history.state && 
                                        window.history.state.state && 
                                        window.history.state.state === lastPageStates.state.length - 1 ? true : false;

        
        console.log('Keeping history');

        if (!historyFiltered || executeOnBeforeUnload) {

            let totalStatesLength = 0;
            totalStates.forEach(currentState => totalStatesLength += currentState.state ? currentState.state.length : 0);
            console.log('Checking total length for states at page is correct: ' + totalStatesLength);
            page = pageReloaded ? 0 : page;

            sessionStorage.setItem('pageStatus', JSON.stringify({
                totalStates: totalStates,
                lastSavedPage: { page: page, totalStates: totalStatesLength }
            }));

        }

        if (!sessionStorage.getItem('pageStatus')) {
            // Values that need to be set when user reloads the page
            sessionStorage.setItem('pageStatus', JSON.stringify({
                totalStates: totalStates,
                lastSavedPage: { page: 0, state: 'initial' }
            }));
        }

    } 

};