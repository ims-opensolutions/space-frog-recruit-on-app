## RecruitOn 

<p align="center">
  <img src="https://github.com/ims-opensolutions/space-frog-recruit-on-app/blob/master/logo/Recruit0n_big.jpg" width=500 alt="RecruitOn Logo" />
</p>

<p align="center">  
  <a href="" target="_blank"><img alt="version" src="https://img.shields.io/badge/version-1.0-brightgreen.svg?style=flat" /></a>
  <a href="" target="_blank"><img alt="owner" src="https://img.shields.io/badge/owner-MKNA--dev-127ab5.svg?style=flat" /></a>
  <a href="https://www.linkedin.com/in/iv%C3%A1n-miranda-stavenuiter-b40412b7/" target="_blank"><img alt="linkedin" src="https://img.shields.io/badge/social-LinkedIn-106494.svg?style=flat" /></a>
  <a href="https://twitter.com/im_stavenuiter" target="_blank"><img alt="twitter" src="https://img.shields.io/twitter/follow/im_stavenuiter.svg?style=social&label=Follow" /></a>
</p>

<p align="center">A web application to handle and process an organization's candidates data</p>

## Description

<p align="justify">RecruitOn is a humble web application which aims to <b>ease the process of handling, filtering and organizing potential candidates personal data</b>. Target here is actually any <b>organization or company</b> that deals with <b>recruiting processes</b> (normally HHRR team). It works resorting on a simple UI which allows the user to upload an excel file. The logic behind the application process this data and shows it back to the client in a user-friendly way. </p>

<p align="justify">The application offers some interesting functions. Among them, we have:</p>

* <p>Filtering through different parameters: qualification, salary and location</p>
* <p>Ubicate the candidate in a map</p>

## Features

<p align="justify">Most important, remarkable feature regarding UX is a <b>custom handling of browser navigation history</b></p>

## Tools

* <p><a href="https://developer.chrome.com/docs/extensions/reference/webRequest/">Chrome Web Request API</a></p>
* <p><a href="https://developer.mozilla.org/es/docs/Web/API/History" target="_blank">JavaScript History API</a></p>
* <p><a href="https://developer.mozilla.org/es/docs/Web/API/Web_Crypto_API" target="_blank">JavaScript Web Crypto API</a></p>
* <p><a href="https://letsencrypt.org/docs/certificates-for-localhost/" target="_blank">Let's Encrypt certificates</a></p>
* <p><a href="https://nestjs.com/" target="_blank">NestJS</a></p>

## Security

<p align="justify">From its very early birth stage, RecruitOn was thought to be build and constructed <b>in the most secure possible way, giving thus to this factor a top priority</b>. For this to be achieved, a different approach from traditional user-password login mechanism was desired. The main goal was authenticating requestes made by RecruitOn, accepting only them and rejecting any other one coming from a different source.</p>

<p align="justify">The core of the security RecruitOn engine has been finally set up throuhg <b>Chrome Web Request API</b>. In a simplified explanation, this API works by installing an extension on chrome, which intercepts any requests coming from the application. Next, it <b>encrypts a given payload</b> that is sent to the server in hexadecimal format, which will be responsible for decrypting this data and validating it.</p>

<p align="justify">A <b>second security</b> layer has been configured through <b>short-live cookies</b>. These are triggered on onbeforeunload JavaScript native event, allowing the client to create them only when the next request is about to be launched. This shortens up the time the cookie is present in the browser. In addition, the lifetime of the cookie is just 2 seconds. Then, the browser purges it. To assure a background layer against potential CSRF attacks, <b>samesite</b> attribute is also set along the rest of the cookie properties. Cookie values are <b>base64 encoded</b>.</p>

<p align="justify">Finally, <b>all the traffic is encrypted</b> even in development phase. This has been done with self-certified <b>https credentials</b> provided by Let's Encrypt.</p>

## Running

<p><code>npm install</code></p>
<p><code>npm run start:dev</code></p>

<p align="justify"><b>Server will throw an error if excel file doesn't comply certain rules.</b> Please, find a model template inside files folder to guide yourself.</p>

## Versions

* <p>1.0</p>

## Branches 

* <p>Master</p>

## Warnings

* <p>Only running on <b>Chrome</b></p>
* <p>Encryption takes place on chrome extension code. I encourage potential users of the app to <b>hide/obfuscate</b> the code to prevent security issues</p>
* <p>Design <b>has not</b> been a priority. Serious CSS improvements can be introduced</p>

## License

<p align="justify">All rights reserved to <b>MKNA security software development<b>.</p>

