const onBeforeRequestFilter = { urls: [
  "https://localhost:3000/file-manager/generate",
  "https://localhost:3000/file-manager/render",
  "https://localhost:3000/file-manager/map/*"
] };

let encHex;
let endpoint;
const endpointKeys = ['generate', 'map', 'render'];
var mainHeaders;

const onBeforeRequestOptions = ['blocking', 'requestBody', 'extraHeaders'];
const onBeforeRequestCallback = function(details) {

    console.log('Before request');

    endpoint = endpointKeys.find(endpointKey => details.url.indexOf(endpointKey) > -1);
    
    const Buffer = require('buffer').Buffer;

    var aesAlgorithmKeyGen = {
      name: "AES-CBC",
      // AesKeyGenParams
      length: 128
    };

    var aesAlgorithmEncrypt = {
      name: "AES-CBC",
      // AesCbcParams
      iv: window.crypto.getRandomValues(new Uint8Array(16))
    };
    
    const request = {
      resource: details.url,
      method: details.method,
      requestBody: details.requestBody
    }

    var encoder = new TextEncoder('utf-8');
    const requestJSON = JSON.stringify(request);
    var clearDataArrayBufferView = encoder.encode(requestJSON);

    window.crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('????????????????').buffer,
        aesAlgorithmKeyGen,
        true,
        ['encrypt', 'decrypt']).then(customKey => {


      window.crypto.subtle.encrypt(aesAlgorithmEncrypt, customKey, clearDataArrayBufferView).then(encString => {
            const encUint8Array = new Uint8Array(encString);

            const encArray = Array.from(encUint8Array);
            const ivArray = Array.from(aesAlgorithmEncrypt.iv);
            
            const encAndIvArray = encArray.concat(ivArray);
            
            encHex = Buffer.from(encAndIvArray.toString()).toString('hex');
        });

    });

}

const onBeforeSendHeadersFilter = { urls: [
  "https://localhost:3000/file-manager/generate",
  "https://localhost:3000/file-manager/render",
  "https://localhost:3000/file-manager/map/*"
] };
const onBeforeSendHeadersOptions = ['blocking', 'requestHeaders', 'extraHeaders'];
const onBeforeSendHeadersCallback = function(details) {
    console.log('Before sending headers');

    mainHeaders = details.requestHeaders;
    console.log(mainHeaders);
    const customHeaders = { name: 'Authorization', value: encHex };
    mainHeaders.push(customHeaders);
    return { requestHeaders: mainHeaders }
}

const onSendHeadersFilter = { urls: [
  "https://localhost:3000/file-manager/generate",
  "https://localhost:3000/file-manager/render",
  "https://localhost:3000/file-manager/map/*"
] };
const onSendHeadersCallback = function(details) {
    console.log('On sending headers');
}
  
chrome.webRequest.onBeforeSendHeaders.addListener(
    onBeforeSendHeadersCallback,
    onBeforeSendHeadersFilter,
    onBeforeSendHeadersOptions 
);

chrome.webRequest.onSendHeaders.addListener(
    onSendHeadersCallback,
    onSendHeadersFilter,
    ['requestHeaders', 'extraHeaders']
);

chrome.webRequest.onBeforeRequest.addListener(
    onBeforeRequestCallback,
    onBeforeRequestFilter,
    onBeforeRequestOptions
);
