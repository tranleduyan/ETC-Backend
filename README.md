<p align="left">
  <img src="src_code/src/assets/ETCLogo.png" alt="Logo" width="75" height="75">
</p>

# ETC-Backend

## About
This is a repo that stores and runs the backend and middleware for the ETC - ECS Tool Checkout Web Application. We are using AWS Lambda and Express.js to implement a REST API server that will take in requests from the client and return the appropriate responses.

## Development Team: Team ERC
#### Mohammed Mahmood
Scrum Master/Project Manager
#### Karena Qian
Back-end Developer
#### Le Duy An Tran
UI/UX & Front-end Developer
#### Michael Sun
Front-end Developer
#### Aman Siid
Full-stack & Back-end Developer

## Contents of README
- [Directory Tree](#directory-tree-descriptions)
- [Prerequisites](#prerequisites)
- [How to Run](#how-to-install-and-run)

## Directory Tree Descriptions
**Bolded**: directory<br>
_Italicized_: file<br>
***Bolded and Italicized***: important directory!
- ***src_code***: stores the majority of the code in this repo
  - **express_app**: stores the main program that runs the Express server
    - _app.js_: code that sets up and starts the Express server
  - **src**: stores various features and endpoints called by the Express server
    - ***configurations***
      - **database**
        - **db_scripts**
          - **table_creation**
            - _placeholder.sql_
          - **update_table**
            - _placeholder.sql_
        - _DatabaseConfigurations.js_
    - ***controllers***
      - **interfaces**
        - _IAuthentication.js_
      - **services**
        - Authentication
          - _SignIn.js_
    - ***documentation***
      - _swagger.js_
    - ***routes***
      - _AuthenticationRoutes.js_
    - ***utils***
      - **interfaces**
        - _IDBHelperFunctions.js_
        - _IResponseBuilder.js_
      - **services**
        - **helper_functions**
          - **db_helper_functions**
            -  _DBHelperFunctions.js_
          - **general_helper_functions**
            - _placeholder.js_
        - **response_builder**
          - _ResponsiveBuilder.js_
- _.gitignore_: specifies the files to be ignored by any GitHub action
- _index.js_: code that creates and exports the handler for AWS Lambda
- _package.json_: holds the build configuration of this whole repo (dependencies, version, scripts, etc.)

## Prerequisites
This repo uses npm and Node.js: [How to Install npm and Node.js](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

## How to Install and Run
First install all needed dependencies
npm install
Then simply start the server
npm run start 
There you go! Now you can start sending requests to the server :)
