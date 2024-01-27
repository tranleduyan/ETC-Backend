const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

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
 *      "typeId": x (optional later),
 *      "modelId": x (optional later),
 *      "maintenanceStatus": "Ready" OR "Under Repair" (optional later),
 *      "reservationStatus": "Available" OR "In Use" (optional later),
 *      "usageCondition": "Used" OR "New" (optional later),
 *      "purchaseCost": 1102.23 (optional),
 *      "purchaseDate": "2016-12-08" (optional)
 *  }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function EquipmentUpdate(res, req, serialId) {
    try{
        /** Validate information before communicate with database */
        const errors = await Promise.resolve(EquipmentUpdateValidation(res, req, serialId));
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const { typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;
        let equipmentInfo = {};
        
        if(typeId){
            equipmentInfo["FK_TYPE_ID"] = typeId;
        }

        if(typeId){
            equipmentInfo["FK_MODEL_ID"] = typeId;
        }        
        
        if(typeId){
            equipmentInfo["MAINTENANCE_STATUS"] = typeId;
        }

        if(typeId){
            equipmentInfo["RESERVATION_STATUS"] = typeId;
        }

        if(typeId){
            equipmentInfo["USAGE_CONDITION"] = typeId;
        }

        if(typeId){
            equipmentInfo["PURCHASE_COST"] = typeId;
        }

        if(typeId){
            equipmentInfo["PURCHASE_DATE"] = typeId;
        }

        /** Update the equipment */
        await db("equipment")
            .update({ 
                FK_TYPE_ID: typeId,
                FK_MODEL_ID: modelId,
                MAINTENANCE_STATUS: maintenanceStatus.trim(),
                RESERVATION_STATUS: reservationStatus.trim(),
                USAGE_CONDITION: usageCondition.trim(),
                PURCHASE_COST: purchaseCost,
                PURCHASE_DATE: purchaseDate
            })  
            .where("PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim());

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
        const { schoolId, typeId, modelId, maintenanceStatus, reservationStatus, usageCondition, purchaseCost, purchaseDate } = req;
        
        /** We check for all required variables */
        if(!schoolId || typeof(typeId) == "undefined" || typeof(modelId) == "undefined" || !maintenanceStatus || !reservationStatus || !usageCondition) {
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
        console.log("ERROR: There is an error while validating update equipment: ", error);
        /** Return error message to the client */
        return responseBuilder.ServerError(res, "There is an error while validating update equipment.");
    }
}

module.exports = {
    EquipmentUpdate
}
