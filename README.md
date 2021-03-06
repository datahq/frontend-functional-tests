[![Build Status](https://travis-ci.org/datahq/frontend-functional-tests.svg?branch=master)](https://travis-ci.org/datahq/frontend-functional-tests)

Functional testing for frontend and API testing for all services

## Usage for functional testing for frontend

* Tests will be automatically run by travis daily. It tests only `finance-vix` and `gdp-uk` core datasets.
  * If travis build fails, we can check it on travis logs
  * else, frontend works fine for the following tests

  | property | test | output |
  | -------- | -------- | -------- |
  | id | timestamp | timestamp |
  | name | dataset name | dataset name |
  | page_status | status code and description | status code and description |
  | page_title | page title | OK OR NOT OK |
  | dataset_title | dataset title | OK OR NOT OK |
  | readme | readme | OK OR NOT OK |
  | csv_links | all csv links  | status code and description |
  | json_links | json links | status code and description |
  | zip_links | zip links | status code and description |
  | datapackage_json | datapackage.json | status code and description |
  | total_load_time | total loading time | in milliseconds |
  | script_laod_time | script loading time | in milliseconds |
  | layout_load_time | layouts loading time | in milliseconds |
  | tables | preview table | OK OR NOT OK |
  | graphs | graph | OK OR NOT OK |
  
## Usage for API testing for all services

Tests will be automatically run by travis daily.
Environmental vairables to set up:
`DOMAIN` - domain address, testing or production
`SPECSTORE` - spectore API, testing or production
`API` - API, testing or production
`AUTH_TOKEN` - Authorization token
`AUTH_TOKEN_PERMISSION` - Permission token for a service, in our case `rawstore`
`OWNERID` - ownerid, in this test, we use `examples`

It tests API for the following services:
* specstore status
* specstore info
* specstore upload
* auth permission for a service
* auth check an authentication token validity
* auth change the username
* auth receive authorization public key
* metastore search
* metastore search events
* resolver username to userid
* bitstore(rawstore) get authorized upload URL
* bitstore(rawstore) get information regarding the datastore

## Validation test 

Validation test is located in `test/validation.test.js`, and it covers the following cases:
* small dataset
  * cause CSV to fail after validation
  * multiple resources
  * datasets that fail validation but not pipeline(duplicated row)
  * multiple errors per file
  * public(unlisted) 
* big dataset
  * cause CSV to fail before validation
  * Different validation errors(invalid metadata and data)
* processing dataset by providing invalid flow.yml
* redirection dataset
  * private dataset
* all specstore statuses for above mentioned datasets


