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
        const { equipmentTypeName } = req;

        /** If the type does not exist, add it to the database */
        const addedType = await Promise.resolve(dbHelper.AddTypeToDatabase(db, equipmentTypeName));

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
 * Validates a user based on the provided school ID, checking for validity and admin privileges.
 *
 * @param {string} schoolId - The school ID associated with the user.
 * @returns {string|null} - A validation message or null if the user is valid.
 *    - Returns a string if there's an invalid request, error in retrieving user information,
 *      user not found, or insufficient permissions.
 *    - Returns null to indicate that the user is valid.
 */
async function ValidateUser(schoolId) {
    /** Ensure that schoolId should always be string */
    if(typeof schoolId !== "string") {
        return "Invalid type of school id.";
    }
        
    /** Ensure school id is valid numeric */
    if(isNaN(parseInt(schoolId, 10))) {
        return "Invalid school id.";
    }

    /** Retrieve user information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId));

    /** If there is error while retrieve user information, return error */
    if(typeof user === "string") {
        return user;
    }

    /** If user is not exist, return not found message */
    if(!user) {
        return "User not found.";
    }

    /** Ensure user is an admin */
    if(user.userRole !== "Admin"){
        return "You don't have permission to perform this action.";
    }

    /** Return null to indicate user is valid */
    return null;
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
        const { equipmentTypeName, schoolId} = req;
        
        /** Check if user is filled in required fields */
        if(!equipmentTypeName || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure user is valid */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }

        /** Check if type name is exists (or already added) */
        const existType = await Promise.resolve(dbHelper.GetTypeInfoByName(db, equipmentTypeName));

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
