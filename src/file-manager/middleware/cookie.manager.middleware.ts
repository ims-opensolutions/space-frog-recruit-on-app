import { ForbiddenException, Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction } from "express";
import { Request, Response } from 'express';


@Injectable()
export class CookieManagerMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction) {
      
    const cookie = request.headers.cookie;

    if (!cookie) {
        throw new ForbiddenException('Forbidden');
    }

    const regExpResult = cookie.match(/((_p=|_s=)[^;]*;?){1}/g);

    if (!regExpResult) {
        throw new ForbiddenException('Forbidden');
    }

    let payload;
    if (regExpResult.length > 1) {
        payload = regExpResult.find(reg => reg.indexOf('_p=') > -1);
    } else {
        payload = regExpResult.toString();
    }

    const key = payload.substring(3, payload.length - 10);

    if (!key || key.length === 0) {
        throw new ForbiddenException('Forbidden');
    }
    
    const credentials = Buffer.from(key, 'base64').toString('ascii');

    let credentialsObject;
    try {   
        credentialsObject = JSON.parse(credentials);
    } catch(err) {
        console.log(err);
        throw new ForbiddenException('Forbidden');
    }

    if (!credentialsObject || !credentialsObject.hasOwnProperty('referer') || !credentialsObject.hasOwnProperty('method')) {
        throw new ForbiddenException('Forbidden');
    }

    console.log(credentialsObject);
    next();
    
  }
}
