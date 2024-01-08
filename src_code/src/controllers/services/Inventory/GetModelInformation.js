/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * GetModelInformation - Retrieves information for a specific model.
 *
 * @param {Object} res - Express response object.
 * @param {string} modelId - The identifier for the model to retrieve information.
 * @returns {Object} - The response object representing the outcome of the operation.
 *                     Possible responses include 400 Bad Request, 404 Not Found,
 *                     and 200 OK with the retrieved model information - modelId, modelName, modelPhotoId, modelPhoto, typeName.
 * 
 * Response Body:
 * {
 *   "message": "JINYISI information successfully retrieved.",
 *   "responseObject": {
 *       "modelId": 65,
 *       "modelName": "JINYISI",
 *       "modelPhotoId": "1KrNWnG9_uvajmegDs96bqPRAeVjqvKGP",
 *       "modelPhoto": "https://drive.google.com/uc?id=1KrNWnG9_uvajmegDs96bqPRAeVjqvKGP",
 *       "typeName": "Barometer"
 *   }
 * }
 * 
 */
async function GetModelInformation(res, modelId) {
    try { 
        /** If model id is invalid, return 400 Bad Request */
        if(isNaN(parseInt(modelId, 10))) {
            return responseBuilder.BadRequest(res, "Invalid request");
        }

        /** Retrieve type information */
        const model = await Promise.resolve(dbHelper.GetModelInfoByModelId(db, modelId));
        
        /** If there is error while retrieving model's information, return 503 Server Error */
        if(typeof model === "string"){
            return responseBuilder.ServerError(res, model);
        }

        /** If type not found, return 404 Not Found */
        if(!model) {
            return responseBuilder.NotFound(res, "Model");
        }

        /** Return 200 OK */
        return responseBuilder.GetSuccessful(res, model, `${model.modelName} information`);
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while retrieving model information:", error);
        return responseBuilder.ServerError(res, "There is an error occur while retrieving model information.");
    }
}

/** Exports the module */
module.exports = {
    GetModelInformation
}
