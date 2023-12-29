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
        // TODO: get RFID/locaation info from request?
        const { typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;

        /** Prepare data for table insert */
        // TODO: add RFID/location info to insert data
		const insertData = {
			PK_EQUIPMENT_SERIAL_ID: req.serialId,
			FK_TYPE_ID: typeId,
			FK_MODEL_ID: modelId,
            FK_CURRENT_ROOM_READER_ID: null,
            TAG_ID: null,
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
async function AddToolValidation(res, req) {
    try{
        /** Destructure variables from the request body */
        const { serialId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;
        
        /** We check for all variables even though they are optional because we expect to have them in request body */
        if(!serialId || !typeId || !modelId || !maintenanceStatus || !reservationStatus || !usageCondition || !purchaseCost || !purchaseDate) {
            return responseBuilder.MissingContent(res);
        }
        
        /** Validate serial ID */
        const serialIdError = await Promise.resolve(SerialIdValidator(res, serialId));
        if(serialIdError) {
            return serialIdError;
        }

        /** Validate tool maintenance status */
        const maintenanceStatusError = MaintenanceStatusValidator(res, maintenanceStatus);
        if(maintenanceStatusError) {
            return maintenanceStatusError;
        }

        /** Validate tool reservation status */
        const reservationStatusError = ReservationStatusValidator(res, reservationStatus);
        if(reservationStatusError) {
            return reservationStatusError;
        }

        /** Validate tool usage condition */
        const usageConditionError = UsageConditionValidator(res, usageCondition);
        if(usageConditionError) {
            return usageConditionError;
        }
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating add tool: ", error);
        
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating add tool.");
    }
}

/**
 * Validates the serial ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} serialId - The serial ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function SerialIdValidator(res, serialId) {
    const serialIdTemp = serialId.trim();

    /** Validate the length of the serial ID. */
    if(serialIdTemp.length > 30) {
        return responseBuilder.BadRequest(res, "serial ID is longer than 30 characters.");
    }

    /** Retrieve tool with the serial ID to check for the uniqueness */
    const toolWithSerialId = await dbHelper.GetToolBySerialId(db, serialIdTemp);

    /** Check if the toolWithSerialId is not null and if it type is string, return bad request */
    if(toolWithSerialId && typeof toolWithSerialId === "string") {
        return responseBuilder.BadRequest(res, toolWithSerialId);
    }

    /** If there is already a tool with the serial ID, return bad request */
    if(toolWithSerialId) { 
        return responseBuilder.BadRequest(res,"The serial ID is already in use.");
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the tool maintenance status (must be 'Ready' or 'Under Repair' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} maintenanceStatus - The tool maintenance status to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function MaintenanceStatusValidator(res, maintenanceStatus) {
    if(maintenanceStatus.trim() !== "Ready" && maintenanceStatus.trim() !== "Under Repair") {
        return responseBuilder.BadRequest(res, "Invalid maintenance status.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the tool reservation status (must be 'Available' OR 'In Use' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} reservationStatus - The tool reservation status to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function ReservationStatusValidator(res, reservationStatus) {
    if(reservationStatus.trim() !== "Available" && reservationStatus.trim() !== "In Use") {
        return responseBuilder.BadRequest(res, "Invalid reservation status.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the tool usage condition (must be 'Used' OR 'New' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} usageCondition - The tool usage condition to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function UsageConditionValidator(res, usageCondition) {
    if(usageCondition.trim() !== "Used" && usageCondition.trim() !== "New") {
        return responseBuilder.BadRequest(res, "Invalid usage condition.")
    }

    /** Indicate pass the validation */
    return null;
}

/** Exports the module/functions */
module.exports = {
    AddTool,
    AddToolValidation
}
