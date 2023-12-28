/** This file is for AWS Lambda Handler (NO NEED TO CHANGE ANYTHING) */

/** Initialize neccessary module */
const awsServerlessExpress = require("aws-serverless-express");
const app = require("./src_code/express_app/app");

/** Create the server for AWS Lambda */
const server = awsServerlessExpress.createServer(app);

/** Exports the hanlder */
exports.handler = (event, context) => {
  awsServerlessExpress.proxy(server, event, context);
};
