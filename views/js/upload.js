window.history.pushState(null, null, window.location.pathname + window.location.search);
let fileRecord = [];
let pageForm = document.forms[0];
let processButton = document.querySelector('input.excel-file');
let avoidAutomaticFileUpload = true;

pageForm[1].onchange = () => {
    console.log('On change');
    console.log(avoidAutomaticFileUpload);
    if (!avoidAutomaticFileUpload) {
        let fileList = pageForm[1].files;
        if (pageForm[1].value !== '') {
            fileRecord = Array.from(fileList);
            console.log('File uploaded... Generating file record');
        }
    }
}

window.onload = () => {
    console.log('Loading window... Setting fileRecord to empty');
    fileRecord = [];
}

processButton.onclick = () => {
    pageForm[1].value = '';
    console.log('Allowing upload of file on change');
    avoidAutomaticFileUpload = false;
}

pageForm.onsubmit = (e) => {
    e.preventDefault();
    console.log('Submitting the form');
    console.log(fileRecord.length);

    if (fileRecord.length === 0) {
        let errorMessage = document.querySelector('p.par-lvl-4.error-message');
        errorMessage.style.display = 'block';
    } else {
        pageForm.submit();
    }
}

let query = window.location.search;

if (!query || query.trim() === '' || !query.trim().startsWith('?name=') || query.trim().length <= 6) window.location = '/file-manager/' ;

let uploadButton = document.querySelectorAll('button.upload-button')[0];
let fileInput = document.querySelectorAll('input.excel-file')[0];

uploadButton.onclick = () => {
    if (fileInput && fileInput !== undefined && fileInput !== null) {
        fileInput.click();
    }
}
