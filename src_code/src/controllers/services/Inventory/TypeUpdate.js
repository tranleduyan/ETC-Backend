/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle updates an equipment type in the database.
 * 
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing the request body.
 * @param {string} typeId - The ID of the equipment type to be updated.
 * @returns {Promise<Object>} - A promise that resolves to an object representing any validation errors or rejection reason.
 */
async function TypeUpdate(res, req, typeId) {
    try{
        /** Validate information before communicate with database */
        const errors = await Promise.resolve(TypeUpdateValidation(res, req, typeId));
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const { equipmentTypeName } = req;

        /** Update the type */
        await db("equipment_type")
            .update({ TYPE_NAME: equipmentTypeName })  
            .where("PK_TYPE_ID", "=", parseInt(typeId,10));

        /** Return update successful message */
        return responseBuilder.UpdateSuccessful(res, null, "Type");
    } catch(error) {
        /** Log errors and return 503 */
        console.log("ERROR: There is an error while updating type:", error);
        return responseBuilder.ServerError(res, "There is an error while updating type.")
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
 * Handle validation before actually perform updating type
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The body of the request containing update type details.
 * @returns {object} Response - if failed validation, send back to client bad request response, otherwise null.
 */
async function TypeUpdateValidation(res, req, typeId) {
    try{
        /** Destructure variables from the request body */
        const { equipmentTypeName, schoolId} = req;
        
        /** Check if user is filled in required fields */
        if(!equipmentTypeName || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that equipment type name is always a string type */
        if(typeof equipmentTypeName !== "string"){
            return responseBuilder.BadRequest(res, "Invalid type of type's name.");
        }

        /** Ensure typeId is a valid numeric type */
        if(isNaN(parseInt(typeId, 10))) {
            return responseBuilder.BadRequest(res, "Invalid type id.");
        }

        /** Convert type id from string to numeric for easy use */
        const numericTypeId = parseInt(typeId, 10);

        /** Ensure user is valid */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }

        /** Check if type name is exists (or already added) */
        const existTypePromise = dbHelper.GetTypeInfoByName(db, equipmentTypeName);

        /** Retrieve requested type information  */
        const requestTypePromise = dbHelper.GetTypeInfoByTypeId(db, numericTypeId);

        /** Perform promises concurrently */
        const [existType, requestType] = await Promise.all([existTypePromise, requestTypePromise]);

        /** Ensure requested type exists */
        if(!requestType) {
            return responseBuilder.NotFound(res, "Type");
        }

        /** If there is error with request type information, return error */
        if(typeof requestType === "string") {
            return responseBuilder.ServerError(res, requestType);
        }

        /** If type name is exists, check if it error, and ensure the exist type name is not actually the type 
         *  we are changing (this avoid bad request when client accidentally send with the unchanged name) 
         */
        if(existType) {
            /** Handle error while retrieving exist type */
            if(typeof existType === "string") {
                return responseBuilder.ServerError(res, existType);
            } else if(existType.typeId !== numericTypeId) {
                /** Ensure the exist type is different than request type */
                return responseBuilder.BadRequest(res, "Type name already exists. Please try other names.");
            }
        }
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating update type: ", error);
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating update type.");
    }
}

module.exports = {
    TypeUpdate
}