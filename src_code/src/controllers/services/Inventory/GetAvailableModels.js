/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieve available models within a specified date range.
 * @param {Object} res - Express response object.
 * @param {string} startDate - Start date for availability check.
 * @param {string} endDate - End date for availability check.
 * @returns {Object} - Response object indicating success or failure.
 */
async function GetAvailableModels(res, startDate, endDate) {
    try{
        /** Validate the date period */
        const datePeriodError = DatePeriodValidation(startDate, endDate);
        if(datePeriodError) {
            return responseBuilder.BadRequest(res, datePeriodError);
        }

        /** Fetch all models from the database */
        const allModels = await db("equipment_model")
            .select(
                "equipment_type.TYPE_NAME as typeName",
                "equipment_model.FK_TYPE_ID AS typeId",
                "equipment_model.PK_MODEL_ID as modelId",
                "equipment_model.MODEL_NAME as modelName",
                "equipment_model.MODEL_PHOTO_URL as modelPhoto"
            )
            .join("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID");

        /** Check if there are no models, return a BadRequest response */
        if (!allModels || allModels?.length === 0) {
            return responseBuilder.BadRequest(res, "There is no model available in this period of time.");
        }

        /** Create promise for concurrently fetch availableCount for each model */
        const availabilityPromises = allModels.map(async (model) => {
            const availableCount = await dbHelpers.GetEquipmentAvailableCount(db, model.modelId, model.typeId, startDate, endDate);
            if (availableCount > 0) {
                return {
                    modelId: model.modelId,
                    modelName: model.modelName,
                    modelPhoto: model.modelPhoto,
                    typeName: model.typeName,
                    availableCount: availableCount,
                };
            }
            return null;
        });

        /** Wait for all promises to resolve */
        const responseObject = (await Promise.all(availabilityPromises)).filter(result => result !== null);

        /** Return Get Successful message with response to the client */
        return responseBuilder.GetSuccessful(res, responseObject, "Available models");
    } 
    catch(error) {    
        /** Log error and return 503 */
        console.log("ERROR: There is an error while retrieving available models:", error);
        return responseBuilder.ServerError(res, "There is an error while retrieving available models/equipments.");
    }
}

/**
 * Validate the start and end date for availability checks.
 * @param {string} startDate - Start date for availability check.
 * @param {string} endDate - End date for availability check.
 * @returns {string|null} - Error message if validation fails, otherwise null.
 */
function DatePeriodValidation(startDate, endDate) {
    /** Initialize start date and end date time for validation */
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const today = new Date(0);
    
    /** Ensure startDate and endDate are valid date forms */
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return "Start date or end date is invalid.";
    }
    
    /** Ensure startDate is not before today */
    if (startDateTime < today) {
        return "There is no available models in this period of time.";
    }

    /** Ensure startDate is always before endDate */
    if (startDateTime > endDateTime) {
        return "You cannot view models' availability when the start date is after the return date.";
    }

    /** Return null indicate valid date */
    return null;
}

/** Export the modules */
module.exports = {
    GetAvailableModels
}
