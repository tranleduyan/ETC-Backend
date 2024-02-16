/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieves information about a requested type based on typeId.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} typeId - the  
 * @returns {object} - The response object indicating the result of the operation.
 *                    If successful, returns a 200 status with an object of type information;
 *                    If no types are found, returns a 404 status with a corresponding message;
 *                    If type id is invalid, returns 400 status with a bad request message;
 *                    If an error occurs, returns a 503 status with an error message.
 * 
 * Response object will be: 
 * {
 *      typeId: int,
 *      typeName: string
 * }
 */
async function GetTypeInformation(res, typeId) {
    try { 
        /** If type id is invalid, return 400 Bad Request */
        if(isNaN(parseInt(typeId, 10))) {
            return responseBuilder.BadRequest(res, "Invalid request");
        }

        /** Retrieve type information */
        const type = await Promise.resolve(dbHelper.GetTypeInfoByTypeId(db, typeId));

        /** If cannot get type by some reasons, return 503 Server Error */
        if(typeof type === "string") {
            return responseBuilder.ServerError(res, type);
        }

        /** If type not found, return 404 Not Found */
        if(!type) {
            return responseBuilder.NotFound(res, "Type");
        }

        /** Return 200 OK */
        return responseBuilder.GetSuccessful(res, type, `${type.typeName} information`);
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while retrieving type information:", error);
        return responseBuilder.ServerError(res, "There is an error occur while retrieving type information.");
    }
}

/** Exports the module */
module.exports = {
    GetTypeInformation
}
