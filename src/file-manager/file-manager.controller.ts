import { Controller, Get, Render, Post, UseInterceptors, UploadedFile, BadRequestException, Body, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { Candidate } from './entities/candidate';
import * as fs from 'fs';
import * as path from 'path';

@Controller('file-manager')
export class FileManagerController {

    @Get()
    @Render('greeting')
    getGreetingPage(): void {}

    @Get('upload')
    @Render('upload')
    getUploadForm(@Query() name: string) {
        console.log(name);
        return { name: name };
    }

    @Post('generate')
    @Render('results')
    @UseInterceptors(FileInterceptor('excel-file'))
    async generateResults(@UploadedFile() file) {

        const data = new Uint8Array(file.buffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const worksheet = workbook.Sheets['Sheet 1'];

        const headers = ['Id', 'Name', 'Surname', 'Mail', 'Phone', 'City', 'Age', 'Salary', 'Site', 'Qualification'];
        const headerReference = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

        // 1 - Validate in custom method
        for (const headerChar of headerReference) {
            if (!headers.includes(worksheet[headerChar + '1'].v)) {
                throw new BadRequestException('Header names do not fit the requirements. Check header row');
            }
        }

        const rowsRegExp = /[I]{1}[0-9]*/;
        let rows;

        for (const key in worksheet) {
            if (rowsRegExp.test(key)) {
                rows = parseInt(key.substring(1, 2));
            }
        }

        for (let i = 2; i < rows + 1; i++) {
            for (const headerChar of headerReference) {
                if (worksheet[headerChar + i.toString()] === undefined || worksheet[headerChar + i.toString()].v.toString().trim() === '') {
                    throw new BadRequestException('Bad content. Review empty values or check if rows are correct');
                }
            }
        }

        console.log('Data for datasheet correct. Proceeding to gather all information');

        // 2 - Reading the document
        const candidates = [];
        for (let i = 2; i < rows + 1; i++) {
            let candidate = new Candidate();
            for (const headerChar of headerReference) {
                let property = worksheet[headerChar + "1"].v.toString().toLowerCase();

                if (property === 'id' || property === 'age' || property === 'salary' || property === 'qualification') {
                    if (!parseInt(worksheet[headerChar + i.toString()].v)) {
                        throw new BadRequestException('Content for numbers incorrect. Impossible to format');
                    }
                }

                if (property === 'phone' && typeof worksheet[headerChar + i.toString()].v === 'number') {
                    candidate[property] = worksheet[headerChar + i.toString()].v.toString();
                } else if (property === 'id') {
                    candidate[property] = parseInt(worksheet[headerChar + i.toString()].v);
                } else {
                    candidate[property] = worksheet[headerChar + i.toString()].v;
                }

            }
            candidates.push(candidate);
        }

        console.log('Data gathered correctly. Comparing against database');

        // 3 - Reading first from JSON database and inserting/updating results
        const databaseUrl = path.join(__dirname, '../../', 'database/local-database.json');

        let userDatabase;
        const returnedData = await new Promise(function(resolve, reject) {

            fs.readFile(databaseUrl, 'utf8', (err, data) => {
                if (err)
                    throw err;
                if (data) {
                    userDatabase = JSON.parse(data);
    
                    userDatabase = userDatabase.map((currentUser, mainIndex) => {
                        candidates.forEach((insertedUser, nestedIndex) => {
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
                // console.log(returnedData);
                fs.writeFile(databaseUrl, userDatabase, 'utf8', (err) => {
                    if (err)
                        throw err;
                });
                // console.log(userDatabase);
                // console.log(JSON.stringify(userDatabase));
                // const deleted = [];
                // const filteredUsers = userDatabase.filter((currentUser, mainIndex) => {
                //     if (!deleted.includes(mainIndex)) {
                //         userDatabase.forEach((comparedUser, nestedIndex) => {
                //             if (
                //                 (currentUser.name.toLowerCase().trim() === comparedUser.name.toLowerCase().trim() &&
                //                 currentUser.surname.toLowerCase().trim() === comparedUser.surname.toLowerCase().trim() &&
                //                 mainIndex !== nestedIndex) ||
                //                 (currentUser.mail.toLowerCase().trim() === comparedUser.mail.toLowerCase().trim() &&
                //                 mainIndex !== nestedIndex) ||
                //                 (currentUser.phone.toLowerCase().trim() === comparedUser.phone.toLowerCase().trim() &&
                //                 mainIndex !== nestedIndex)
                //             ) {
                //                 console.log('Values repeated detected on this user. Checking user info...');
                //                 console.log('Name: ' + comparedUser.name);
                //                 console.log('Surname: ' + comparedUser.surname);
                //                 console.log('Mail: ' + comparedUser.mail);
                //                 console.log('Phone: ' + comparedUser.phone);
                //                 console.log('Row for the wrong user is: ' + nestedIndex);
                //                 deleted.push(nestedIndex);
                //             }
                //         });
                //         return true;
                //     } else {
                //         return;
                //     }
                // });

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
        

        // 3 - Writing candidates items on a local JSON "database"
        // const candidatesToJson = JSON.stringify(candidates);


        // fs.open(databaseUrl, 'a', (err, fd) => {
        //     if (err) throw err;
        //     fs.appendFile(fd, candidatesToJson, 'utf8', (err) => {
        //         console.log(fd);
        //       fs.close(fd, (err) => {
        //         if (err) throw err;
        //       });
        //       if (err) throw err;
        //     });
        // })


        // return { data: returnedData }

    }

  
}
