const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * 
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the tool addition attempt.
 * 
 * Expected Request Body: 
 * {
 *     "serialId": "mi15Op3a",
 *     "typeId": x,
 *     "modelId": x,
 *     "maintenanceStatus": "Ready" OR "Under Repair",
 *     "reservationStatus": "Available" OR "In Use",
 *     "usageCondition": "Used" OR "New",
 *     "purchaseCost": 1102.23,
 *     "purchaseDate": "2016-12-08"
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function AddTool(res, req) {
    try {
        /** Validate add tool body to see if information they request to our endpoint is valid */
        const errors = await Promise.resolve(AddToolValidation(res, req));
        if(errors) {
            return errors;
        }

        /** If validation pass, we need to destructure variables (see above) from the request body for use. */
        const { serialId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;

        /** Prepare data for table insert */
		const insertData = {
			PK_EQUIPMENT_SERIAL_ID: serialId.trim(),
			FK_TYPE_ID: typeId,
			FK_MODEL_ID: modelId,
			MAINTENANCE_STATUS: maintenanceStatus.trim(),
			RESERVATION_STATUS: reservationStatus.trim(),
			USAGE_CONDITION: usageCondition.trim(),
			PURCHASE_COST: purchaseCost,
			PURCHASE_DATE: purchaseDate
		}

		/** Insert data into the table */
		await db("equipment").insert(insertData);

        /** Return a success response */
        return responseBuilder.BuildResponse(res, 200, {
            message: "New tool added successfully.",
        });
    } catch(error) {
        /** adding error, easy to debug */
        console.log("ERROR: There is an error while adding tool: ", error);
        /** Return error message to client */
        return responseBuilder.ServerError(res, "There is an error while adding tool.");
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
        const { serialId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;
        
        
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating add tool: ", error);
        
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating add tool.");
    }
}

/** Exports the module/functions */
module.exports = {
    TypeAddition,
    TypeAdditionValidation
}
