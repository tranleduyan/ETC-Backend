/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieves information about all equipment types from the database.
 *
 * @param {object} res - The response object for the HTTP request.
 * @returns {object} - The response object indicating the result of the operation.
 *                    If successful, returns a 200 status with an array of type information;
 *                    if no types are found, returns a 404 status with a corresponding message;
 *                    if an error occurs, returns a 503 status with an error message.
 * 
 * Response object will be an array, and each item will have this: 
 * {
 *      modelId: int,
 *      modelName: string,
 *      modelPhoto: URL, 
 *      typeName: string
 * }
 */
async function GetAllModelsOfType(res, typeId) {
    try {
        /** Ensure that typeId is a numeric value */
        if(isNaN(parseInt(typeId, 10))) {
            return responseBuilder.BadRequest(res, "Invalid request.");
        }

        /** Retrieve Type Information */
        const typePromise = Promise.resolve(dbHelper.GetTypeInfoByTypeId(db, typeId));

        /** Retrieve all models that the requested type have */
        const modelsPromise = db("equipment_model").select(
            "PK_MODEL_ID AS modelId",
            "MODEL_NAME AS modelName",
            "MODEL_PHOTO_URL AS modelPhoto"
        ).where("FK_TYPE_ID", "=", parseInt(typeId, 10));

        /** Perform the promise concurrently */
        const [type, models] = await Promise.all([typePromise, modelsPromise]);

        /** Ensure that the type exists */
        if(!type) {
            return responseBuilder.NotFound(res, "Type");
        }

        /** Ensure that there is no error when retrieve the type */
        if(typeof type === "string") {
            return responseBuilder.ServerError(res, type);
        }

        /** If there is no types at all, return not found */
        if(!models || models.length === 0) {
            return responseBuilder.BuildResponse(res, 404, {
                message:"There isn't any existed model. Please add more."
            })
        }

        /** Build response object with model information and type information */
        const responseObject = models.map((model) => ({
            ...model,
            typeName: type.typeName,
        }))

        /** If there is type and get successfully, return 200 */
        return responseBuilder.GetSuccessful(res, responseObject, "All models");
    } catch(error) {
        /** Log and return 503 */
        console.log("ERROR: There is an error while retrieving all types: ", error);
        return responseBuilder.ServerError(res, "There is an error while retrieving all types.");
    }
}

/** Exports the module */
module.exports = {
    GetAllModelsOfType
}
