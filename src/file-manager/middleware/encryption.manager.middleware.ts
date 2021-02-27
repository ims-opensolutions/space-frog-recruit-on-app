import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { NextFunction } from "express";
import * as config from '../config/config.json';
import { Request, Response } from 'express';


@Injectable()
export class EncryptionManagerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {

    let endpoint;
    const endpointKeys = ['generate', 'map', 'render'];     
    endpoint = endpointKeys.find(endpointKey => request['baseUrl'].indexOf(endpointKey) > -1);

    const url = 'https://localhost:3000' + request['baseUrl'];
    const method = request.method;

    const headersToLower = Object.keys(request.headers).map(headerKey => headerKey.toLowerCase());

    if (!headersToLower.includes('authorization')) {
        throw new UnauthorizedException('Unauthorized');
    }

    const encHex = request.headers['authorization'];
    
    const encString = Buffer.from(encHex, 'hex').toString('ascii');

    if (encString === '') {
        throw new UnauthorizedException('Unauthorized');
    }

    const encStringArray = encString.split(',');

    const encIntArray = encStringArray.map(number => parseInt(number));

    const encUint8ArrayAndIvArrays = Uint8Array.from(encIntArray);

    if (encUint8ArrayAndIvArrays.length <= 16) {
        throw new UnauthorizedException('Unauthorized');
    }

    const ivArray = encUint8ArrayAndIvArrays.slice(encUint8ArrayAndIvArrays.length - 16, encUint8ArrayAndIvArrays.length);
    const encUint8Array = encUint8ArrayAndIvArrays.slice(0, encUint8ArrayAndIvArrays.length - 16);

    const webcrypto = require('@trust/webcrypto');
    const crypto = webcrypto.crypto;

    var aesAlgorithmKeyGen = {
        name: "AES-CBC",
        // AesKeyGenParams
        length: 128
    };

    var aesAlgorithmEncrypt = {
        name: "AES-CBC",
        // AesCbcParams
        iv: Uint8Array.from(ivArray)
    };

    crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode('????????????????').buffer,
        aesAlgorithmKeyGen,
        true,
        ['encrypt', 'decrypt']).then(customKey => {
            crypto.subtle.decrypt(aesAlgorithmEncrypt, customKey, encUint8Array).then(response => {
                console.log('Decrypting...');
                const decryptedString = new TextDecoder().decode(new Uint8Array(response));
                const decryptedJSON = JSON.parse(decryptedString);

                console.log(decryptedJSON);
                
                const requestedResource = config[method][endpoint];

                if (Object.keys(requestedResource).length !== Object.keys(decryptedJSON).length) {
                    throw new UnauthorizedException('Unauthorized');
                }

                if (!decryptedJSON.hasOwnProperty('resource') || !decryptedJSON.hasOwnProperty('method')) {
                    throw new UnauthorizedException('Unauthorized'); 
                }

                if (requestedResource.method !== decryptedJSON.method || !new RegExp(requestedResource.resource, 'g').test(decryptedJSON.resource)) {
                    throw new UnauthorizedException('Unauthorized'); 
                }

                if (decryptedJSON.method === 'POST') {
                    const uploadedFileArray = decryptedJSON.requestBody.raw;
                    const uploadedFileKeys = uploadedFileArray.map(nestedObject => Object.keys(nestedObject)).flat();
                                                            
                    if (endpoint === 'render') {
                        if (!uploadedFileKeys.includes('bytes')) {
                            throw new UnauthorizedException('Unauthorized'); 
                        }
                    } else {
                        if (!uploadedFileKeys.includes('bytes') || !uploadedFileKeys.includes('file')) {
                            throw new UnauthorizedException('Unauthorized'); 
                        }
                    }
                    
                }

                next();

            });
        });
    
  }
}
