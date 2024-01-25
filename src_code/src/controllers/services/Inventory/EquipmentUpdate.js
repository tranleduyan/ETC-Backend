const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle updating an equipment in the database.
 * 
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing the request body.
 * @param {string} serialId - The serial ID of the equipment to be updated.
 * @returns {Promise<Object>} - A promise that resolves to an object representing any validation errors or rejection reason.
 * 
 * Expected Request Body: 
 * {
 *      "something": "wii-party"
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function EquipmentUpdate(res, req, serialId) {
    try{

        /** Return update successful message */
        return responseBuilder.UpdateSuccessful(res, null, "Equipment");
    } catch(error) {
        /** Log errors and return 503 */
        console.log("ERROR: There is an error while updating equipment:", error);
        return responseBuilder.ServerError(res, "There is an error while updating equipment.")
    }
}

/**
 * Handle validation before actually perform updating equipment
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The body of the request containing update equipment details.
 * @returns {object} Response - if failed validation, send back to client bad request response, otherwise null.
 */
async function EquipmentUpdateValidation(res, req, serialId) {
    try{
        
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating update equipment: ", error);
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating update equipment.");
    }
}

module.exports = {
    EquipmentUpdate
}
