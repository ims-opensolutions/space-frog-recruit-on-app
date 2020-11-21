console.log('Loading test.js');

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

let payload = 'ewogICAgInJlZmVyZXIiOiAiL2ZpbGUtbWFuYWdlci9nZW5lcmF0ZSIsCiAgICAibWV0aG9kIjogIkdFVCIKfQ==' + addAleatoryHash();
var t = new Date();
let newDate = t.setSeconds(t.getSeconds() + 10);
let date = new Date(newDate);
document.cookie = '_p=' + payload + '; expires=' + date.toGMTString();

console.log(document.cookie);

console.log('Loaded');

