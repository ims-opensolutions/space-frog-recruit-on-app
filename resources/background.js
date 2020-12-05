const onBeforeSendHeadersFilter = { urls: ["http://localhost:3000/file-manager/generate"] };
const onBeforeSendHeadersOptions = ['blocking', 'requestHeaders'];
const onBeforeSendHeadersCallback = function(details) {
    console.log('Before sending headers');
    console.log(details);
    if (details.method === 'GET') {
        return {
            requestHeaders: [ { name: 'Cache-control', value: 'Testing' } ]
        } 
    }
}

const onSendHeadersFilter = { urls: ["http://localhost:3000/file-manager/generate"] };
const onSendHeadersCallback = function(details) {
    console.log('On sending headers');
    console.log(details);
}

const onHeadersReceivedFilter = { urls: ["http://localhost:3000/file-manager/generate"] };
const onHeadersReceivedOptions = ['blocking', 'responseHeaders'];
const onHeadersReceivedCallback = function(details) {
    console.log('On headers received');
    console.log(details);
}


chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersCallback, 
    onBeforeSendHeadersFilter, 
    onBeforeSendHeadersOptions
);

chrome.webRequest.onSendHeaders.addListener(
    onSendHeadersCallback,
    onSendHeadersFilter,
    ['requestHeaders']
);

chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceivedCallback,
    onHeadersReceivedFilter,
    onHeadersReceivedOptions
)
