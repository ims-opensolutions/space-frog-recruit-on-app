window.history.pushState(null, null, window.location.pathname + window.location.search);
let fileRecord = [];
let pageForm = document.forms[0];
let processButton = document.querySelector('input.excel-file');
let avoidAutomaticFileUpload = true;
let keepCheckbox; 
let overwriteCheckbox;

const databaseStatusContainer = document.querySelector('div.dv-lvl-1.database-status');
const isThereAnyRecordOnDatabase = databaseStatusContainer.className.indexOf('visible') > -1;

if (isThereAnyRecordOnDatabase) {
    databaseStatusContainer.style.display = 'block';
    keepCheckbox = document.querySelector('label.lbl-lvl-3.input-container.input-keep input');
    overwriteCheckbox = document.querySelector('label.lbl-lvl-3.input-container.input-overwrite input');
    
    overwriteCheckbox.checked = true;
    
    keepCheckbox.onclick = () => {
        if (overwriteCheckbox.checked) {
            overwriteCheckbox.checked = false;
        }
    }
    
    overwriteCheckbox.onclick = () => {
        if (keepCheckbox.checked) {
            keepCheckbox.checked = false;
        }
    }
    
    console.log(keepCheckbox);
    console.log(overwriteCheckbox);
}

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
        if (keepCheckbox && overwriteCheckbox) {
            const noVisibleChild = document.createElement('div');
            noVisibleChild.className = 'dv-lvl-3 input-box hidden';
            noVisibleChild.appendChild(keepCheckbox);
            noVisibleChild.appendChild(overwriteCheckbox);
            pageForm.appendChild(noVisibleChild);
        }
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
