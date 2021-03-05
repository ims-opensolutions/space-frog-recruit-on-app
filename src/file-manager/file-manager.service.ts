import { Injectable } from '@nestjs/common';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { Candidate } from './entities/candidate';
import { Request, Response } from 'express';
import { Filter } from './entities/filter';
import { FileManagerRepository } from './file-manager.repository';

@Injectable()
export class FileManagerService {

    private fileManagerRepository: FileManagerRepository;
    constructor() {
        this.fileManagerRepository = new FileManagerRepository();
    }

    async generateResults(file: any, mode?: string) {

        try {

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
    
            const rowsRegExp = /[0-9]{1,}/;
            let rows;
            let worksheetKeys = Object.keys(worksheet);
            let lastKey = worksheetKeys[worksheetKeys.length - 2]
            rows = parseInt(lastKey.match(rowsRegExp).toString());
    
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
            return await this.fileManagerRepository.handleIncomingDocument(candidates, mode);

        } catch (err) {
            console.log(`An error occurred when generating the results`);
            console.log(`Error details here: ${err}`);
        }

    }

    async renderResults(filters: Filter) {

        try {

            let dataToView = {};
    
            let returnedData = await this.fileManagerRepository.readDocument();
    
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

        } catch (err) {
            console.log(`An error occurred while rendering (POST) the results`);
            console.log(`Error details here: ${err}`);
        }
 
    }

    async getCandidatesData(request: Request, response: Response) {

        try {

            let returnedData = await this.fileManagerRepository.readDocument();

            if (returnedData) {
                return response.render(
                    'results',
                    { data: returnedData }
                  );
            }
            
        } catch (err) {
            console.log(`An error occurred while getting the candidates data (GET)`);
            console.log(`Error details here: ${err}`);
        }

    }

    async isThereAnyRecordInDatabase(): Promise<boolean> {
        return await this.fileManagerRepository.isThereAnyRecordInDatabase();
    }
}
