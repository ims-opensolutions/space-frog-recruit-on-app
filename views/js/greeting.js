let form = document.forms[0];

let referrer = document.referrer;

if (document.referrer && document.referrer.indexOf('upload') > -1) {
    let badRequestMessage = form.querySelector('span.error-bad-request');
    badRequestMessage.style.display = 'block';
}

form.onsubmit = (e) => {
    e.preventDefault();
    let name = form.querySelector('input.name');
    
    if (!name || name.value.trim() === '') {
        let errorMessage = form.querySelector('span.error-message');
        errorMessage.style.display = 'block';
        return;
    } else {
        form.submit();
    }

}