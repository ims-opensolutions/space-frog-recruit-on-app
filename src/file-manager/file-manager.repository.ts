import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Candidate } from './entities/candidate';
import * as fs from 'fs';
import * as path from 'path';

export class FileManagerRepository {

    async handleIncomingDocument(candidates: Candidate[], mode?: string) {

        const databaseUrl = path.join(__dirname, '../../', 'database/local-database.json');

        let userDatabase;
        const returnedData = await new Promise(function(resolve, reject) {

            fs.readFile(databaseUrl, 'utf8', (err, data) => {
                if (err)
                    throw err;
                if (mode && mode === 'keep' && data) {
                    console.log(`Keeping data. Updating with changed values`);
                    userDatabase = JSON.parse(data);
    
                    userDatabase.forEach((currentUser) => {
                        candidates.forEach((insertedUser) => {
                            if (currentUser.id === insertedUser.id) {
                                // update
                                currentUser = insertedUser;
                            }
                            else {
                                // insert
                                if (userDatabase.filter(comparedUser => comparedUser.id === insertedUser.id).length === 0) {
                                    console.log('Not detected. Inserting.');
                                    userDatabase.push(insertedUser);
                                }
                            }
                        });
                        return currentUser;
                    });
                }
                else {
                    // Database is empty
                    console.log(`Overwritting data.`);
                    userDatabase = candidates;
                }
    
                // Repeated values validation
                userDatabase.forEach((currentUser) => {
                    userDatabase.find((comparedUser) => {
                        if ((currentUser.name.toLowerCase().trim() === comparedUser.name.toLowerCase().trim() &&
                            currentUser.surname.toLowerCase().trim() === comparedUser.surname.toLowerCase().trim() &&
                            currentUser.id !== comparedUser.id) ||
                            (currentUser.mail.toLowerCase().trim() === comparedUser.mail.toLowerCase().trim() &&
                                currentUser.id !== comparedUser.id) ||
                            (currentUser.phone.toLowerCase().trim() === comparedUser.phone.toLowerCase().trim() &&
                                currentUser.id !== comparedUser.id)) {
                            console.log('Values repeated detected on this user. Checking user info...');
                            console.log('Name: ' + comparedUser.name);
                            console.log('Surname: ' + comparedUser.surname);
                            console.log('Mail: ' + comparedUser.mail);
                            console.log('Phone: ' + comparedUser.phone);
                            throw new BadRequestException('Repeated key values for different users detected. Please, review your datasheet');
                        }
                    });
                });
    
                console.log('Integrity validation for data passed. Database populated. Showing results');
                userDatabase = JSON.stringify(userDatabase);
                fs.writeFile(databaseUrl, userDatabase, 'utf8', (err) => {
                    if (err)
                        throw err;
                });
                
                if (err) {
                   reject(err); 
                } else {
                    resolve(JSON.parse(userDatabase));
                }
                
            });

        });

        if (returnedData) {
            return { data: returnedData };
        }
    }

    async readDocument() {

        const databaseUrl = path.join(__dirname, '../../', 'database/local-database.json');

        let returnedData = await new Promise(function(resolve, reject) {

            fs.readFile(databaseUrl, 'utf8', (err, data) => {

                if (err) {
                    throw err;
                }

                if (!data)  {
                    throw new InternalServerErrorException('Database not populated');
                }

                if (err) {
                    reject(err); 
                 } else {
                    resolve(JSON.parse(data));
                 }
                 
            });

        });

        return returnedData;
    }

    async isThereAnyRecordInDatabase(): Promise<boolean> {

        const databaseUrl = path.join(__dirname, '../../', 'database/local-database.json');

        let returnedData = await new Promise(function(resolve, reject) {

            fs.readFile(databaseUrl, 'utf8', (err, data) => {

                try {

                    if (err) {
                        throw err;
                    }
    
                    if (err) {
                        reject(err); 
                     } else {
                        if (data !== null && data !== undefined && typeof data === 'string') {
                            resolve(JSON.parse(data));
                        }
                     }

                } catch (err) {
                    console.log(`There has been an error while reading the data`);
                    console.log(`Details here: ${err}`);
                }

                resolve(undefined);
                 
            });

        }).catch(err => {
            console.log(`There has been an error while reading the data`);
            console.log(`Details here: ${err}`);
        });

        return returnedData !== undefined && 
               returnedData !== null && 
               Array.isArray(returnedData) && 
               Object.keys(returnedData[0]).includes('id');
   
    }
}