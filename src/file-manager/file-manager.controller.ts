import { Controller, Get, Render, Post, UseInterceptors, UploadedFile, BadRequestException, Body, Query, Param, Req, UseFilters, InternalServerErrorException, ForbiddenException, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as XLSX from 'xlsx';
import { Candidate } from './entities/candidate';
import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
import { Filter } from './entities/filter';


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

    @Get('map/:id')
    @Render('map')
    getMap(@Param('id') id) {
    }

    //     if (id) {
    //         const userId = parseInt(id);
    //         let map;

    //     function initMap() {
    //         map = new google.maps.Map(document.querySelectorAll("div.map-container")[0], {
    //         center: {
    //             lat: 48.113397,
    //             lng: 15.670853
    //         },
    //         zoom: 4
    //         });

    //         const geocoder = new google.maps.Geocoder();

    //         let xmlHttpRequest;

    //         if (window.XMLHttpRequest) {
    //             xmlHttpRequest = new XMLHttpRequest();
    //         } else if (window.ActiveXObject) {
    //             xmlHttpRequest = new ActiveXObject("Microsoft.XMLHTTP");
    //         }

    //         let filters;
    //         xmlHttpRequest.onreadystatechange = () => {
    //             filters = {
    //                 'city' : true,
    //             };
    //         };

    //         xmlHttpRequest.open('POST', '/file-manager/render', true);

    //         if (xmlHttpRequest.readyState > 0) {
    //             xmlHttpRequest.setRequestHeader('Content-Type', 'application/json');
    //         }

    //         xmlHttpRequest.send(JSON.stringify(filters));

    //         xmlHttpRequest.onload = () => {

    //             if (xmlHttpRequest.readyState === 4 && xmlHttpRequest.status === 201) {
    //                 const response = JSON.parse(xmlHttpRequest.responseText);

    //                 let user = response.object.find(currentUser => userId === currentUser.id);

    //                 geocoder.geocode({ address: user.city }, (results, status) => {
    //                     if (status === "OK") {
    //                         new google.maps.Marker({
    //                             map: map,
    //                             position: results[0].geometry.location
    //                         });
    //                     } else {
    //                     alert("Geocode was not successful for the following reason: " + status);
    //                     }
    //                 });
    //             }
    //         }
    

    //     }
    //     } else {
    //         throw new InternalServerErrorException('You must provide an id to generate the map');
    //     }
    // }

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
            console.log(worksheet[headerChar + '1'].v);
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

        console.log(returnedData);

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

    @Post('render')
    async renderResults(@Body() filters: Filter) { 

        console.log(filters);

        let dataToView = {};
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

        const candidatesData = returnedData as Candidate[];

        dataToView = {
            mode: 'initial',
            object: candidatesData
        };

        if (!filters) {
            throw new InternalServerErrorException('Filters not sent');
        }

        let candidatesGroupedByCity = [];
        let filteredCities = [];
        if (filters && filters.city) {
            const cities = candidatesData.map(candidate => candidate.city);
            
            // Remove duplicate on cities
            for (const city of cities) {
                if (!filteredCities.includes(city)) {
                    filteredCities.push(city);
                }
            }

            filteredCities = filteredCities.sort();

            // Gets candidates grouped by city
            for (const city of filteredCities) {
                candidatesData.filter(candidate => candidate.city === city)
                              .forEach(candidate => candidatesGroupedByCity.push(candidate));
            }

            console.log('_____ONLY SORTED BY CITY____');
            console.log(candidatesGroupedByCity);

            dataToView = {
                mode: 'city',
                object: candidatesGroupedByCity
            };

        }

        if (filters && filters.salary) {

            // If already sorted by city
            if (candidatesGroupedByCity && candidatesGroupedByCity.length > 0) {
                let candidatesGroupedByCityAndSalary = [];
                if (filteredCities) {
                    for (const city of filteredCities) {
                        candidatesGroupedByCityAndSalary.push({
                            [city] : []
                        });
                    }
                }

                candidatesGroupedByCity.forEach(candidate => {
                    candidatesGroupedByCityAndSalary.forEach(cityObject => {
                        let selectedCity = Object.keys(cityObject).toString();
                        if (candidate.city === selectedCity) {
                            cityObject[selectedCity].push(candidate);
                        }
                    });
                })

                for (const cityObjects of candidatesGroupedByCityAndSalary) {
                    for (const key in cityObjects) {
                        cityObjects[key] = cityObjects[key].sort((candidateA, candidateB) => {
                            if (candidateA.salary > candidateB.salary) return -1;
                            if (candidateA.salary === candidateB.salary) return 0;
                            if (candidateA.salary < candidateB.salary) return 1;
                        });
                    }
                }

                console.log('_____SORTED BY CITY AND SALARY____');
                for (const cityObjects of candidatesGroupedByCityAndSalary) {
                    console.log(cityObjects);
                }

                dataToView = {
                    mode: 'city/salary',
                    object: candidatesGroupedByCityAndSalary
                };

            } else {

                // If only salary filter selected
                let candidatesGroupedBySalary = [];
                candidatesGroupedBySalary = candidatesData.sort((candidateA, candidateB) => {
                    if (candidateA.salary > candidateB.salary) return -1;
                    if (candidateA.salary === candidateB.salary) return 0;
                    if (candidateA.salary < candidateB.salary) return 1;
                });

                console.log('_____SORTED BY SALARY____');
                console.log(candidatesGroupedBySalary);

                dataToView = {
                    mode: 'salary',
                    object: candidatesGroupedBySalary
                };
            }

        }

        if (filters && filters.qualification) {

            // If already sorted by city
            if (candidatesGroupedByCity && candidatesGroupedByCity.length > 0) {
                let candidatesGroupedByCityAndQualification = [];
                if (filteredCities) {
                    for (const city of filteredCities) {
                        candidatesGroupedByCityAndQualification.push({
                            [city] : []
                        });
                    }
                }

                candidatesGroupedByCity.forEach(candidate => {
                    candidatesGroupedByCityAndQualification.forEach(cityObject => {
                        let selectedCity = Object.keys(cityObject).toString();
                        if (candidate.city === selectedCity) {
                            cityObject[selectedCity].push(candidate);
                        }
                    });
                })

                for (const cityObjects of candidatesGroupedByCityAndQualification) {
                    for (const key in cityObjects) {
                        cityObjects[key] = cityObjects[key].sort((candidateA, candidateB) => {
                            if (candidateA.qualification > candidateB.qualification) return -1;
                            if (candidateA.qualification === candidateB.qualification) return 0;
                            if (candidateA.qualification < candidateB.qualification) return 1;
                        });
                    }
                }

                console.log('_____SORTED BY CITY AND QUALIFICATION');
                for (const cityObjects of candidatesGroupedByCityAndQualification) {
                    console.log(cityObjects);
                }

                dataToView = {
                    mode: 'city/qualification',
                    object: candidatesGroupedByCityAndQualification
                };

            } else {

                // If only qualification filter selected
                let candidatesGroupedByQualification = [];
                candidatesGroupedByQualification = candidatesData.sort((candidateA, candidateB) => {
                    if (candidateA.qualification > candidateB.qualification) return -1;
                    if (candidateA.qualification === candidateB.qualification) return 0;
                    if (candidateA.qualification < candidateB.qualification) return 1;
                }); 

                console.log('_____SORTED QUALIFICATION');
                console.log(candidatesGroupedByQualification);

                dataToView = {
                    mode: 'qualification',
                    object: candidatesGroupedByQualification
                };

            }

        }

        return dataToView;
    }

    @Get('generate')
    async getCandidatesData(@Req() request: Request, @Res() res: Response) {

        // const cookie = request.headers.cookie;

        // if (!cookie) {
        //     throw new ForbiddenException('Forbidden');
        // }

        // const regExpResult = cookie.match(/(_p=[^;]*;?){1}/g);

        // if (!regExpResult) {
        //     throw new ForbiddenException('Forbidden');
        // }

        // let payload = regExpResult.toString();
    
        // const key = payload.substring(3, payload.length - 10);

        // if (!key || key.length === 0) {
        //     throw new ForbiddenException('Forbidden');
        // }
        
        // const credentials = Buffer.from(key, 'base64').toString('ascii');

        // let credentialsObject;
        // try {   
        //     credentialsObject = JSON.parse(credentials);
        // } catch(err) {
        //     console.log(err);
        //     throw new ForbiddenException('Forbidden');
        // }

        // if (!credentialsObject || !credentialsObject.hasOwnProperty('referer') || !credentialsObject.hasOwnProperty('method')) {
        //     throw new ForbiddenException('Forbidden');
        // }

        // console.log(credentialsObject);

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

        if (returnedData) {
            console.log(request.headers);
            return res.render(
                'results',
                { data: returnedData }
              );
        }

    }
  
}
