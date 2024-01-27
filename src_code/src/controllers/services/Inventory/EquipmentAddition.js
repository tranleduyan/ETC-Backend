const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const gHelper = require("../../../utils/interfaces/IHelperFunctions");

/**
 * This function takes in information about an equipment provided by the administrator, validates it, and adds it to the database.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the equipment addition attempt.
 * 
 * Expected Request Body: 
 * {
 *     "schoolId": "901234123"
 *     "serialId": "mi15Op3a",
 *     "typeId": x,
 *     "modelId": x,
 *     "maintenanceStatus": "Ready" OR "Under Repair",
 *     "reservationStatus": "Available" OR "In Use",
 *     "usageCondition": "Used" OR "New",
 *     "purchaseCost": 1102.23,
 *     "purchaseDate": "2016-12-08"
 * }
 * 
 * Response is the message with status code 200 if successful, 400 or 404 if unsuccessful
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function EquipmentAddition(res, req) {
    try {
        /** Validate add equipment body to see if information they request to our endpoint is valid */
        const errors = await Promise.resolve(EquipmentAdditionValidation(res, req));
        if(errors) {
            return errors;
        }

        /** If validation pass, we need to destructure variables (see above) from the request body for use. */
        // TODO: get RFID/locaation info from request?
        const { serialId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;

        /** optional param purchase cost (null by default) */
        let costData = null;
        /** optional param purchase date (null by default) */
        let dateData = null;

        /** check if purchase cost is provided (optional param) */
        if(purchaseCost) {
            /** keep the cost to only 2 decimal places... */
            costData = purchaseCost.toFixed(2);
        }

        /** check if purchase date is provided (optional param) */
        if(purchaseDate) {
            dateData = purchaseDate;
        }

        /** Prepare data for table insert */
        // TODO: add RFID/location info to insert data
		const insertData = {
			PK_EQUIPMENT_SERIAL_ID: serialId.trim(),
			FK_TYPE_ID: typeId,
			FK_MODEL_ID: modelId,
            FK_CURRENT_ROOM_READER_ID: null,
            TAG_ID: null,
			MAINTENANCE_STATUS: maintenanceStatus.trim(),
			RESERVATION_STATUS: reservationStatus.trim(),
			USAGE_CONDITION: usageCondition.trim(),
			PURCHASE_COST: costData,
			PURCHASE_DATE: dateData
		}

		/** Insert data into the table */
		await db("equipment").insert(insertData);

        /** Return a success response */
        return responseBuilder.BuildResponse(res, 200, {
            message: "New equipment added successfully.",
        });
    } catch(error) {
        /** adding error, easy to debug */
        console.log("ERROR: There is an error while adding equipment: ", error);
        /** Return error message to client */
        return responseBuilder.ServerError(res, "There is an error while adding equipment.");
    }
}

/**
 * Handle validation before actually perform adding type
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The body of the request containing add type details.
 * @returns {object} Response - if failed validation, send back to client bad request response, otherwise null.
 */
async function EquipmentAdditionValidation(res, req) {
    try{
        /** Destructure variables from the request body */
        const { schoolId, serialId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;
        
        /** We check for all required variables */
        if(!schoolId || !serialId || typeof(typeId) == "undefined" || typeof(modelId) == "undefined" || !maintenanceStatus || !reservationStatus || !usageCondition) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that school id is valid, and only admin can perform this action */
        const userError = await Promise.resolve(gHelper.ValidateAdminUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }
        
        /** Validate serial, type, and model IDs */
        const idError = await Promise.resolve(IdValidator(res, serialId, typeId, modelId));
        if(idError){
            return idError;
        }

        /** Validate maintenance, reservation, and usage condition statuses */
        const statusError = StatusValidator(res, maintenanceStatus, reservationStatus, usageCondition);
        if(statusError){
            return statusError;
        }

        /** check if purchase cost is provided (optional param) */
        if(purchaseCost) {
            /** Validate purchase cost */
            const purchaseCostError = PurchaseCostValidator(res, purchaseCost);
            if(purchaseCostError) {
                return purchaseCostError;
            }
        }

        /** check if purchase date is provided (optional param) */
        if(purchaseDate) {
            
            /** Validate purchase date */
            const purchaseDateError = PurchaseDateValidator(res, purchaseDate);
            if(purchaseDateError) {
                return purchaseDateError;
            }
        }
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating add equipment: ", error);
        
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating add equipment.");
    }
}

/**
 * Validates serial, type, and model IDs of request
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {string} serialId - The serial ID to be validated.
 * @param {number} typeId - The type ID to be validated.
 * @param {number} modelId - The model ID to be validated.
 * @return {object|null} - Returns an error response if validation fails, otherwise null.
 */
async function IdValidator(res, serialId, typeId, modelId){
    /** Validate serial ID */
    const serialIdError = await Promise.resolve(SerialIdValidator(res, serialId));
    if(serialIdError) {
        return serialIdError;
    }

    /** Validate type ID */
    const typeIdError = await Promise.resolve(TypeIdValidator(res, typeId));
    if(typeIdError) {
        return typeIdError;
    }

    /** Validate model ID */
    const modelIdError = await Promise.resolve(ModelIdValidator(res, modelId));
    if(modelIdError) {
        return modelIdError;
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates maintenance, reservation, and usage condition statuses of request
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {string} maintenanceStatus - The maintenance status to be validated.
 * @param {string} reservationStatus - The reservation status to be validated.
 * @param {string} usageCondition - The usage condition to be validated.
 * @return {object|null} - Returns an error response if validation fails, otherwise null.
 */
function StatusValidator(res, maintenanceStatus, reservationStatus, usageCondition){
    /** Validate equipment maintenance status */
    const maintenanceStatusError = MaintenanceStatusValidator(res, maintenanceStatus);
    if(maintenanceStatusError) {
        return maintenanceStatusError;
    }

    /** Validate equipment reservation status */
    const reservationStatusError = ReservationStatusValidator(res, reservationStatus);
    if(reservationStatusError) {
        return reservationStatusError;
    }

    /** Validate equipment usage condition */
    const usageConditionError = UsageConditionValidator(res, usageCondition);
    if(usageConditionError) {
        return usageConditionError;
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Checks if the given variable is of the given type
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {any} userVar - The variable to be validated.
 * @param {string} type - The expected type of the given variable
 * @param {string} varTitle - The semantic title of the variable
 * @param {string} expected - A short description of the expected type/values
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function VariableTypeValidator(res, userVar, type, varTitle, expected){
    /** Validate the type of the given variable */
    if(typeof userVar !== type){
        return responseBuilder.BadRequest(res, `Invalid type for ${varTitle}. Expected ${expected}`);
    }
    
    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the serial ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} serialId - The serial ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function SerialIdValidator(res, serialId) {
    /** Make sure serial ID is a string */
    const typeError = VariableTypeValidator(res, serialId, "string", "serial ID", "string");
    if(typeError){
        return typeError;
    }

    const serialIdTemp = serialId.trim();

    /** Validate the length of the serial ID. */
    if(serialIdTemp.length > 30) {
        return responseBuilder.BadRequest(res, "Invalid value, exceeds serial ID char max of 30.");
    }

    /** Retrieve equipment with the serial ID to check for the uniqueness */
    const equipmentWithSerialId = await Promise.resolve(dbHelper.GetEquipmentBySerialId(db, serialIdTemp));

    /** Check if the equipmentWithSerialId is not null and if its type is string, return bad request */
    if(equipmentWithSerialId && typeof equipmentWithSerialId === "string") {
        return responseBuilder.BadRequest(res, equipmentWithSerialId);
    }

    /** If there is already a equipment with the serial ID, return bad request */
    if(equipmentWithSerialId) { 
        return responseBuilder.BadRequest(res,"The serial ID is already in use.");
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the type ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {number} typeId - The type ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function TypeIdValidator(res, typeId) {
    /** Make sure type ID is a non-negative integer */
    const typeError = VariableTypeValidator(res, typeId, "number", "type ID", "non-negative integer");
    if(typeError){
        return typeError;
    }

    if(typeId < 0){
        return responseBuilder.BadRequest(res, 'Invalid value for type ID. Expected non-negative value');
    }

    /** Retrieve type with the type ID to check if it exists */
    const typeInDatabase = await Promise.resolve(dbHelper.GetTypeInfoByTypeId(db, typeId));

    /** Check if the typeInDatabase is not null and if its type is string, return bad request */
    if(typeInDatabase && typeof typeInDatabase === "string") {
        return responseBuilder.BadRequest(res, typeInDatabase);
    }

    /** If there isn't a type with the type ID, return not found */
    if(!typeInDatabase) { 
        return responseBuilder.NotFound(res,`Type with ID ${typeId}`);
    }

    /** Indicate pass the validation */
    // TODO: return type name?
    return null;
}

/**
 * Validates the model ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {number} modelId - The model ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function ModelIdValidator(res, modelId) {
    /** Make sure model ID is a non-negative integer */
    const typeError = VariableTypeValidator(res, modelId, "number", "model ID", "non-negative integer");
    if(typeError){
        return typeError;
    }

    if(modelId < 0){
        return responseBuilder.BadRequest(res, 'Invalid value for model ID. Expected non-negative value');
    }

    /** Retrieve model with the model ID to check if it exists */
    const modelInDatabase = await Promise.resolve(dbHelper.GetModelInfoByModelId(db, modelId));

    /** Check if the modelInDatabase is not null and if its type is string, return bad request */
    if(modelInDatabase && typeof modelInDatabase === "string") {
        return responseBuilder.BadRequest(res, modelInDatabase);
    }

    /** If there isn't a model with the model ID, return bad request */
    if(!modelInDatabase) { 
        return responseBuilder.NotFound(res,`Model with ID ${modelId}`);
    }

    /** Indicate pass the validation */
    // TODO: return model name?
    return null;
}



/**
 * Validates the equipment maintenance status (must be 'Ready' or 'Under Repair' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} maintenanceStatus - The equipment maintenance status to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function MaintenanceStatusValidator(res, maintenanceStatus) {
    /** First make sure that maintenanceStatus is a string */
    const typeError = VariableTypeValidator(res, maintenanceStatus, "string", "maintenance status", "'Ready' or 'Under Repair'");
    if(typeError){
        return typeError;
    }

    /** Now check the value of the maintenance status */
    if(maintenanceStatus.trim() !== "Ready" && maintenanceStatus.trim() !== "Under Repair") {
        return responseBuilder.BadRequest(res, "Invalid value for maintenance status, 'Ready' or 'Under Repair' expected.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the equipment reservation status (must be 'Available' OR 'In Use' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} reservationStatus - The equipment reservation status to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function ReservationStatusValidator(res, reservationStatus) {
    /** First make sure that reservationStatus is a string */
    const typeError = VariableTypeValidator(res, reservationStatus, "string", "reservation status", "'Available' or 'In Use'");
    if(typeError){
        return typeError;
    }

    /** Now check the value of the reservation status */
    if(reservationStatus.trim() !== "Available" && reservationStatus.trim() !== "In Use") {
        return responseBuilder.BadRequest(res, "Invalid value for reservation status, 'Available' or 'In Use' expected.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the equipment usage condition (must be 'Used' OR 'New' only).
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} usageCondition - The equipment usage condition to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function UsageConditionValidator(res, usageCondition) {
    /** First make sure that usageCondition is a string */
    const typeError = VariableTypeValidator(res, usageCondition, "string", "usage condition", "'Used' or 'New'");
    if(typeError){
        return typeError;
    }

    /** Now check the value of the usage condition */
    if(usageCondition.trim() !== "Used" && usageCondition.trim() !== "New") {
        return responseBuilder.BadRequest(res, "Invalid value for usage condition, 'Used' or 'New' expected.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the purchase cost.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {number} purchaseCost - The purchase cost to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function PurchaseCostValidator(res, purchaseCost) {
    /** Make sure purchase cost is a non-negative decimal */
    const typeError = VariableTypeValidator(res, purchaseCost, "number", "purchase cost", "non-negative decimal");
    if(typeError){
        return typeError;
    }

    if(purchaseCost < 0){
        return responseBuilder.BadRequest(res, 'Invalid value for purchase cost. Expected non-negative value');
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the purchase date.
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {string} purchaseDate - The purchase date to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function PurchaseDateValidator(res, purchaseDate){
    /** Make sure purchase date is passed as string */
    const typeError = VariableTypeValidator(res, purchaseDate, "string", "purchase date", "date as string");
    if(typeError){
        return typeError;
    }

    /** Make sure purchase date is actually a YYYY-MM-DD formatted date */
    let datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if(!datePattern.test(purchaseDate.trim())){
        return responseBuilder.BadRequest(res, "Invalid date format, expected a 'YYYY-MM-DD' date.");
    }

    /** Initialize purchase date for validation */
    const purchaseDateTime = new Date(purchaseDate);
    const today = new Date();

    /** Set time to midnight (for comparison) */
    today.setHours(0, 0, 0, 0);
    today.setDate(0);

    /** Ensure purchase date is a valid date value */
    if (isNaN(purchaseDateTime.getTime())) {
        return responseBuilder.BadRequest(res, 'Invalid value for purchase date.');
    }

    /** Ensure purchaseDateTime is not after today */
    if (purchaseDateTime > today) {
        return responseBuilder.BadRequest(res, "Invalid purchase date, expected a date before/at today");
    }

    /** Indicate pass the validation */
    return null;
}

/** Exports the module/functions */
module.exports = {
    EquipmentAddition: EquipmentAddition
}
