/** Import neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/services/helper_functions/db_helper_functions/equipment/EquipmentDBHelperFunctions");
const drive = require("../../../configurations/googleapis/GoogleAPIConfiguration");
const streamifier = require("streamifier");


/**
 * Handle inventory Model Addition by adminstrator.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the model addition attempt.
 * 
 * Expected Form Data: 
 * req.file (Maximum 1 file ends with .jpg, .png, .heic, .hevc, .heif)
 * req.body: 
 * {
 *      "modelName": string,
 *      "typeId": int
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function AntennaScan(res, req) {

    try{
        const scanData = req.body;
        /** Logs for development */ 
        // console.log("--------- Entered AntennaScan");
        // console.log("req.body: ", req.body);
        // console.log("scanData: ", scanData);

        /** Attempt to add scan to database! */
        const addedScan = await Promise.resolve(dbHelper.AddScanToDatabase(db, scanData));

        /** Need to update, addedScan is now array */
        if(typeof addedScan === "string"){
            return responseBuilder.ServerError(res, addedScan);
        }

        /** If create successfully, then return create successful message with entity 'Scan log' */
        return responseBuilder.CreateSuccessful(res, null, "Scan log");
    } catch(error) {

        console.log("ERROR: An error occurred while adding the scan information: ", error);
        return responseBuilder.ServerError(res, "An error occurred while adding the scan information.");
    }
}



/**
 * Validates the type information before adding models to the database.
 *
 * @param {string} typeId - The type ID obtained from the request body.
 * @returns {string|null} - If the validation fails, returns an error message; otherwise, returns null.
 */
async function ValidateType(typeId, modelName) {
    try {
        /** Ensure that type_id is a valid number */
        if(typeof typeId === "string" && isNaN(parseInt(typeId, 10))) {
            return "Invalid type selected."
        }

        /** Retrieve type to see if type_id is an id of an exist type */
        const type = await Promise.resolve(dbHelper.GetTypeInfoByTypeId(db, typeId));
        if(!type) {
            return "Type not found."
        }

        if(typeof modelName !== "string") {
            return "Invalid model name type."
        }

        const existModelName = await db("equipment_model").select("MODEL_NAME AS modelName").where("MODEL_NAME", "LIKE", modelName.trim()).where("FK_TYPE_ID","=", typeId).first();
        if(existModelName) {
            return "This model already exists in this type."
        }

        /** Return null to indicate typeId is valid */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        return "There is an error with the given type.";
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
 *  CURRENTLY NOT BEING USED
 * Handle validation before add scan data to database by administrator computer or valid RFID antenna
 *  
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object | null} - If failed validation, return 400, or null if information is valid
 */
async function NewScanValidation(res, req) {
    try{
        /** Destructure variables from the request body */
        const { scanData, scanTime} = req.body;

        /** Ensure all required fields are provided with information */
        if(!scanData || !scanTime) {
            return responseBuilder.MissingContent(res);
        }

        /**TODO: Ensure Request is from approved device/computer running client */

        /** Return null indicate validation is passed */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while validating scan data: ", error);
        return responseBuilder.ServerError(res, "Sorry, there is an error while validating scan data.");
    }
}
/** Exports the module/functions */
module.exports = {
    AntennaScan: AntennaScan
}
