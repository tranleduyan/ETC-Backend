/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");

/**
 * Retrieves information about all equipment models and their respective equipment counts.
 *
 * @param {Object} res - Express response object for sending HTTP responses.
 * @returns {Object} An HTTP response containing an array of information about equipment models and their counts.
 * If successful, returns a JSON response with status 200 and an array of model information.
 * If no models are found, returns a JSON response with status 400 and an error message.
 * If an error occurs during the process, returns a JSON response with status 503 and an error message.
 */
async function GetAllModels(res, req) {
    try {
        /** Retrieve all models information */
        const allModels = await db("equipment_model")
            .select(
                "equipment_type.TYPE_NAME as typeName",
                "equipment_model.FK_TYPE_ID AS typeId",
                "equipment_model.PK_MODEL_ID as modelId",
                "equipment_model.MODEL_NAME as modelName",
                "equipment_model.MODEL_PHOTO_URL as photoUrl"
            )
            .join("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID");

        /** Check if there are no models, return a BadRequest response */
        if (!allModels || allModels?.length === 0) {
            return responseBuilder.BadRequest(res, "There is no model added yet.");
        }

        /** Concurrently fetch equipment count for each model */
        const responseObject = await Promise.all(allModels.map(async (model) => {
            /** Fetch equipment information for the current model */
            const equipment = await db("equipment")
                .select("PK_EQUIPMENT_SERIAL_ID")
                .where("equipment.FK_TYPE_ID", "=", model.typeId)
                .andWhere("equipment.FK_MODEL_ID", "=", model.modelId);

            /** Calculate the equipment count for the current model */
            const equipmentCount = equipment.length;

            /** Return an object with model information and equipment count */
            return {
                modelId: model.modelId,
                modelName: model.modelName,
                modelPhoto: model.photoUrl,
                typeName: model.typeName,
                equipmentCount: equipmentCount
            };
        }));

        /** Return a successful response with the final responseObject */
        return responseBuilder.GetSuccessful(res, responseObject, "Models");
    } catch (error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while retrieving all models:", error);
        return responseBuilder.ServerError(res, "There is an error while retrieving all models' information.");
    }
}

/** Export the module */
module.exports = {
    GetAllModels
}
