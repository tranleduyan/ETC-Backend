/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle inventory Equipment Removal by administrator.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the removal attempt.
 * 
 * Expected Request Body: 
 * {
 *      "schoolId": "810922119",
 *      "serialId" : ["serialNUM1", "serialNUM2", ...]
 * }
 * 
 * Response is the message with status code 200 if successful.
 * Else return a server error of status code 503 (see ResponsiveBuilder.js)
 */
async function EquipmentRemoval(res, req) {
    try {
        /** Validate information before processing removing an equipment */
        const errors = await Promise.resolve(EquipmentRemovalValidation(res, req));
        if(errors) {
            return responseBuilder.BadRequest(res, errors);
        }

        /** Open the transaction */
        const trx = await db.transaction();

        /** Destructure variables from request body */
        const { serialId } = req;
        
        /** If items serial array is empty, there is nothing to do */
        if(serialId.length === 0) {
            await trx.commit();
            return responseBuilder.DeleteSuccessful(res, "Equipment");
        }

        /** Delete the items based on their serialId from the equipment table */
        await trx("equipment").whereIn("PK_EQUIPMENT_SERIAL_ID", serialId).del();

        /** Commit the transaction */
        await trx.commit();

        /** Return delete successful */
        return responseBuilder.DeleteSuccessful(res,  "Equipment");
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while deleting items", error);
        return responseBuilder.ServerError(res, "There is an error while deleting items.");
    }
}

/**
 * Validates the request parameters for single equipment removal and multiple removal.
 *
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing serial ID and school ID
 * @returns {Object|null} - A response object representing validation errors if validation fails,or null if the validation is successful.
 */
async function EquipmentRemovalValidation(res, req){    
    try {
        /** Destructure the variables from request body */
        const { serialId, schoolId } = req;

        /** Ensure the required fields is filled */
        if(!serialId || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that serialId is an array type */
        if(!Array.isArray(serialId)) {
            return responseBuilder.BadRequest("Invalid request.");
        }

        /** Ensure the user is valid */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }

        /** Ensure the item is valid */
        const itemError = await Promise.resolve(ValidateItem(serialId));
        if(itemError) {
            return responseBuilder.BadRequest(res, itemError);
        }

        /** Return null to indicate pass validation */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while validating item removal:", error);
        return responseBuilder.ServerError(res, "There is an error occur while removing an item.");
    }
}

/**
 * Validates an array of serial IDs.
 *
 * @param {Array} serialId - An array of serial IDs to be validated.
 * @returns {string|null} - A validation error message if validation fails,
 *                          or null if the validation is successful.
 */
async function ValidateItem(serialId) {
    /** If the array of serial IDs is empty, there is nothing to do with it */
    if(serialId.length === 0) {
        return null;
    }

    /** Retrieve all the equipments to ensure that all the items exists */
    const items = await db("equipment").select("PK_EQUIPMENT_SERIAL_ID").whereIn("PK_EQUIPMENT_SERIAL_ID", serialId);

    /** Ensure that all the items exists */
    if(items.length !== serialId.length) {
        return "One of the given item cannot be found."
    }

    /** Return null to indicate serialId are valid */
    return null;
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

/** Exports the module/functions */
module.exports = {
    EquipmentRemoval
}
