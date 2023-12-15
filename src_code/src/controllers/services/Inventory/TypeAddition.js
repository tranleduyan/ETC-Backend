/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");


/**
 * Handle inventory Type Addition by adminstrator.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the type addition attempt.
 * 
 * Expected Request Body: 
 * {
 *      "Type": "Name"
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function TypeAddition(res, req) {
    try {
        /** Validate add type body to see if information they request to our endpoint is valid */
        const errors = await Promise.resolve(TypeAdditionValidation(res, req));
        if(errors) {
            return errors;
        }

        /** If validation pass, we need to destructure variable typeName from the request body for use. */
        const { equipment_type_name } = req;

        /** If the type does not exist, add it to the database */
        const addedType = await Promise.resolve(dbHelper.AddTypeToDatabase(db, equipment_type_name));

        if(typeof addedType === "string"){
            return responseBuilder.ServerError(res, addedType);
        }

        /** Return a success response */
        return responseBuilder.BuildResponse(res, 200, {
            message: "New type added successfully.",
            responseObject: addedType,
        });
    } catch(error) {
        /** adding error, easy to debug */
        console.log("ERROR: There is an error while adding tyoe: ", error);
        /** Return error message to client */
        return responseBuilder.ServerError(res, "There is an error while adding type.");
    }
}

/**
 * Handle validation before actually perform adding type
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The body of the request containing add type details.
 * @returns {object} Response - if failed validation, send back to client bad request response, otherwise null.
 */
async function TypeAdditionValidation(res, req) {
    try{
        /** Destructure variables from the request body */
        const { equipment_type_name } = req;
        
        /** Check if user is filled in required fields */
        if(!equipment_type_name) {
            return responseBuilder.MissingContent(res);
        }

        /** Check if type name is exists (or already added) */
        const existType = await Promise.resolve(dbHelper.GetTypeInfoByName(db, equipment_type_name));

        if(existType) {
           return typeof existType === "string" ? 
           responseBuilder.ServerError(res, existType) : responseBuilder.BadRequest(res, "Type already exist.");
        }
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating add type: ", error);
        
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating add type.");
    }
}

/** Exports the module/functions */
module.exports = {
    TypeAddition,
    TypeAdditionValidation
}