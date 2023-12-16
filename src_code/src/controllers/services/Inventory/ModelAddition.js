const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle inventory Model Addition by adminstrator.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the model addition attempt.
 * 
 * Expected Request Body: 
 * {
 *      "Model": "Model"
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function ModelAddition(res, req) {
    return null;
}

/** Exports the module/functions */
module.exports = {
    ModelAddition
}