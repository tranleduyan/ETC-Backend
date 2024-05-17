const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const gHelper = require("../../../utils/interfaces/IHelperFunctions");

/**
 * Handle updating an equipment in the database.
 * 
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing the request body.
 * @param {string} serialId - The serial ID of the equipment to be updated.
 * @returns {Promise<Object>} - A promise that resolves to an object representing any validation errors or rejection reason.
 * 
 * Expected Request Body: 
 *  {
 *      "schoolId": "901234123",
 *      "typeId": x (optional),
 *      "modelId": x (optional),
 *      "maintenanceStatus": "Ready" OR "Under Repair" (optional),
 *      "reservationStatus": "Available" OR "In Use" (optional),
 *      "usageCondition": "Used" OR "New" (optional),
 *      "purchaseCost": 1102.23 (optional),
 *      "purchaseDate": "2016-12-08" (optional),
 *      "rfidTag": "0001" (optional)
 *  }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function EquipmentUpdate(res, req, serialId) {
    const trx = await db.transaction();
    try{
        /** Validate information before communicate with database */
        const errors = await Promise.resolve(EquipmentUpdateValidation(res, req, serialId));
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const { typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate, rfidTag, homeLocations } = req;
        let equipmentInfo = {};
        
        /** Checking if optional variables exist (and if so, add to update request) */
        if(typeId){
            equipmentInfo["FK_TYPE_ID"] = typeId;
        }

        if(modelId){
            equipmentInfo["FK_MODEL_ID"] = modelId;
        }        
        
        if(maintenanceStatus){
            equipmentInfo["MAINTENANCE_STATUS"] = maintenanceStatus;
        }

        if(reservationStatus){
            equipmentInfo["RESERVATION_STATUS"] = reservationStatus;
        }

        if(usageCondition){
            equipmentInfo["USAGE_CONDITION"] = usageCondition;
        }

        if(purchaseCost){
            equipmentInfo["PURCHASE_COST"] = purchaseCost;
        }

        if(purchaseDate){
            equipmentInfo["PURCHASE_DATE"] = purchaseDate;
        }

        if(rfidTag) {
            equipmentInfo["TAG_ID"] = rfidTag;
        }
        
        const deleteEquipmentHomePromises = trx("equipment_home")
            .where("FK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .del();

        /** Update the equipment */
        const updateEquipmentPromises = trx("equipment")
            .update(equipmentInfo)  
            .where("PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim());

        await Promise.all([deleteEquipmentHomePromises, updateEquipmentPromises]);

        /** Insert new home locations */
        if(homeLocations?.length > 0) {
            const newHomeLocationData = homeLocations.map(homeLocation => ({
                FK_LOCATION_ID: homeLocation,
                FK_EQUIPMENT_SERIAL_ID: serialId.trim()
            }))
    
            await trx("equipment_home").insert(newHomeLocationData);
        }
    
        await trx.commit();

        /** Return update successful message */
        return responseBuilder.UpdateSuccessful(res, null, "Equipment");
    } catch(error) {
        /** Log errors and return 503 */
        console.log("ERROR: There is an error while updating equipment:", error);
        return responseBuilder.ServerError(res, "There is an error while updating equipment.")
    }
}

/**
 * Handle validation before actually perform updating equipment
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The body of the request containing update equipment details.
 * @returns {object} Response - if failed validation, send back to client bad request response, otherwise null.
 */
async function EquipmentUpdateValidation(res, req, serialId) {
    try{
        /** Destructure variables from the request body */
        const { schoolId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate, rfidTag, homeLocations } = req;
        
        /** We check for all required variables */
        if(!schoolId) {
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
        
        if(rfidTag) {
            const existRfidTag = await db("equipment").select("PK_EQUIPMENT_SERIAL_ID").where("TAG_ID", "=", rfidTag.toLowerCase()).first();
            if(existRfidTag && existRfidTag.PK_EQUIPMENT_SERIAL_ID.toLowerCase() !== serialId?.trim().toLowerCase()) {
                return responseBuilder.BadRequest(res, "This RFID Tag is already in used.")
            }
        }

        /** If user add home locations for equipment also, validate it to be array type */
        if(homeLocations && !Array.isArray(homeLocations)) {
            return responseBuilder.BadRequest(res, "Invalid request type.");
        }

        /** Ensure all home location that is given by user is valid location */
        if(homeLocations && homeLocations.length > 0) {
            const locations = await db("location").select("PK_LOCATION_ID").whereIn("PK_LOCATION_ID", homeLocations);
            if(locations && (locations.length !== homeLocations.length)) {
                return responseBuilder.BadRequest(res, "One of the home location is not exists.");
            }
        }

        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating update equipment: ", error);
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating update equipment.");
    }
}

/**
 * Validates serial, type, and model IDs of request
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {string} serialId - The serial ID to be validated (optional).
 * @param {number} typeId - The type ID to be validated (optional).
 * @param {number} modelId - The model ID to be validated (optional).
 * @return {object|null} - Returns an error response if validation fails, otherwise null.
 */
async function IdValidator(res, serialId, typeId, modelId){
    const serialIdError = await Promise.resolve(SerialIdValidator(res, serialId));
    if(serialIdError) {
        return serialIdError;
    }

    if(typeof(typeId) != "undefined"){
        /** Validate type ID */
        const typeIdError = await Promise.resolve(TypeIdValidator(res, typeId));
        if(typeIdError) {
            return typeIdError;
        }
    }
    
    if(typeof(modelId) != "undefined"){
        /** Validate model ID */
        const modelIdError = await Promise.resolve(ModelIdValidator(res, modelId));
        if(modelIdError) {
            return modelIdError;
        }
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates maintenance, reservation, and usage condition statuses of request
 * 
 * @param {object} res - The response object for the HTTP request.
 * @param {string} maintenanceStatus - The maintenance status to be validated (optional).
 * @param {string} reservationStatus - The reservation status to be validated (optional).
 * @param {string} usageCondition - The usage condition to be validated (optional).
 * @return {object|null} - Returns an error response if validation fails, otherwise null.
 */
function StatusValidator(res, maintenanceStatus, reservationStatus, usageCondition){
    if(maintenanceStatus){
        /** Validate equipment maintenance status */
        const maintenanceStatusError = MaintenanceStatusValidator(res, maintenanceStatus);
        if(maintenanceStatusError) {
            return maintenanceStatusError;
        }

    }
    
    if(reservationStatus){
        /** Validate equipment reservation status */
        const reservationStatusError = ReservationStatusValidator(res, reservationStatus);
        if(reservationStatusError) {
            return reservationStatusError;
        }
    }

    if(usageCondition){
        /** Validate equipment usage condition */
        const usageConditionError = UsageConditionValidator(res, usageCondition);
        if(usageConditionError) {
            return usageConditionError;
        }
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

    /** If there is no equipment with the serial ID, return not found */
    if(!equipmentWithSerialId) { 
        return responseBuilder.NotFound(res,`Equipment with serial ID ${serialIdTemp}`);
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

    today.setHours(0, 0, 0, 0);

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

module.exports = {
    EquipmentUpdate
}
