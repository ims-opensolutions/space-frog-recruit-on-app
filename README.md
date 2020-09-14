# RecruitOn Web App

Mini app built on NestJS to process data from uploaded excel files

## What does the app?

The aim of this application is displaying 
information regarding potential candidates 
for a job. It is thought as a helper tool 
for a recruitment manager.
In the next version, some filters and extras will be added
for a better UX.

## Requirements

* Excel file uploaded must contain exactly the required headers, which are:
  * Id, name, surname, mail, phone, age, salary, qualification.
  * All fields must be populated. Otherwise, an error will be thrown.
  * Name, surname, phone and mail are unqiques. Otherwise, 
an error will be thrown.

## Version 1.0

First and most recent version released on 24-8-2020.

## New features for version 2.0

* Filters
* Classification through categories
* Exception custom handling
* Guards for null values on server

## Author 

MKNA APPS



