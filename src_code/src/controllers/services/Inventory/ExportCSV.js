/** Initialize neccessary modules */
const fs = require('fs');
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle inventory export csv by administrator.
 *
 * @param {object} req - The request object for the HTTP request.
 * @param {object} res - The response object for the HTTP request.
 * @returns {object} - This response object indicates the export of equipment data.
 * 
 * Expected Request Body: 
 * {
 *      "schoolId": "810922119"
 * }
 * 
 * Response is the message with status code 200 if successful.
 * Else return a server error of status code 503 (see ResponsiveBuilder.js)
 */
async function ExportCSV(req, res) {
    try {
        /** Assuming the school ID is provided in the request body */
        const { schoolId } = req.body; 

        /** Validate the user */
        const userValidationMessage = await ValidateUser(schoolId);
        if (userValidationMessage) {
            return responseBuilder.BadRequest(res, userValidationMessage);
        }

        /** Fetch inventory data from the database */
        const inventoryData = await db("equipment").select("*");

        /** Validate the fetched inventory data */
        const validationError = await ValidateItems(inventoryData);
        if (validationError) {
            return responseBuilder.MissingContent(res, validationError);
        }

        /** Define headers for the CSV */
        const originalHeaders = Object.keys(inventoryData[0]);

        /** Rename headers for better readability and use a map */
        const headerMapping = {
            "PK_EQUIPMENT_SERIAL_ID": "Serial ID",
            "FK_TYPE_ID": "Type ID",
            "FK_MODEL_ID": "Model ID",
            "FK_CURRENT_ROOM_READER_ID": "Current Room Reader ID",
            "TAG_ID": "Tag ID",
            "MAINTENANCE_STATUS": "Maintenance Status",
            "RESERVATION_STATUS": "Reservation Status",
            "USAGE_CONDITION": "Usage Condition",
            "PURCHASE_COST": "Purchase Cost",
            "PURCHASE_DATE": "Purchase Date"
        };
        const headers = originalHeaders.map(header => headerMapping[header] || header).join(',');

        /** Format inventory data into CSV format */
        const csvData = inventoryData.map(item => {
            /** Replace null values with string "null" for all fields */
            const csvRow = Object.values(item).map(value => {
                return value === null ? "null" : value;
            });
            /** Join values into CSV string */
            return csvRow.join(',');
        }).join('\n');

        /** Write CSV data (including headers) to a file */
        const fullCsvData = `${headers}\n${csvData}`;
        fs.writeFile('equipment.csv', fullCsvData, (err) => {
            if (err) {
                console.error('Error writing CSV file:', err);
                return responseBuilder.ServerError(res,"Failed to export CSV");
            }
            console.log('Equipment data exported to equipment.csv');
            
            /** Send success response to the client */
            return responseBuilder.GetSuccessful(res, "Equipment data exported to equipment.csv");
        });
    } catch (error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while exporting CSV.", error);
        return responseBuilder.ServerError(res, "There is an error while exporting CSV.");
    }
}

/**
 * Validates an array of equipment items.
 *
 * @param {Array} items - An array of equipment items to be validated.
 * @returns {string|null} - A validation error message if validation fails,
 *                          or null if the validation is successful.
 */
async function ValidateItems(items) {
    try {
        /** Check if inventory data is empty */
        if (!items || items.length === 0) {
            return "Inventory data is empty.";
        }

        /** Define an array of fields that are not required (can be null) */
        const nullableFields = [
            "PK_EQUIPMENT_SERIAL_ID",
            "FK_TYPE_ID",
            "FK_MODEL_ID",
            "FK_CURRENT_ROOM_READER_ID",
            "TAG_ID",
            "MAINTENANCE_STATUS",
            "RESERVATION_STATUS",
            "USAGE_CONDITION",
            "PURCHASE_COST",
            "PURCHASE_DATE"
        ];

        /** Check for missing required fields in each item */
        for (const item of items) {
            for (const [field, value] of Object.entries(item)) {
                /** Skip validation for fields that are nullable */
                if (nullableFields.includes(field)) {
                    continue;
                }
                /** Check if the field value is null */
                if (value === null) {
                    console.log(`Field '${field}' is null in the inventory data.`);
                    return `Field '${field}' is null in the inventory data.`;
                }
            }
        }

        /** Return null to indicate items are valid */
        return null;
    } catch (error) {
        /** display error */
        console.error('Error validating items:', error);
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
    const user = await dbHelper.GetUserInfoBySchoolId(db, schoolId);

    /** If there is an error while retrieving user information, return error */
    if(typeof user === "string") {
        return user;
    }

    /** If user does not exist, return not found message */
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

/** Export the functions */
module.exports = {
    ExportCSV
};
