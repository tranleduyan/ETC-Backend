/**
 * Retrieves detailed information about a specific equipment model by its model ID.
 *
 * @param {Object} db - Database connection object.
 * @param {string} modelId - ID of the equipment model to retrieve information for.
 * @returns {Object|null|string} - Information about the equipment model or an error message.
 *    - Returns null if the model is not found.
 *    - Returns a string if there's an invalid request or an error during retrieval.
 */
async function GetModelInfoByModelId(db, modelId) {
    try {
        /** Ensure model id is numeric */
        if(typeof modelId === "string" && isNaN(parseInt(modelId, 10))) {
            modelId = modelId.trim();
            return "There is an error while retrieving model's information. Invalid request."
        }

        /** Retrieve model's information */
        const model = await db.select().from("equipment_model").where("PK_MODEL_ID", "=", modelId).first();

        /** If there is no model, return null, indicate not found */
        if(!model || model.length === 0) {
            return null;
        }

        /** Retrieve type's information of the model */
        const type = await db.select("TYPE_NAME").from("equipment_type").where("PK_TYPE_ID", "=", model.FK_TYPE_ID).first();

        /** Create response object */
        const responseObject = {
            modelId: model.PK_MODEL_ID,
            modelName: model.MODEL_NAME,
            modelPhotoId: model.MODEL_PHOTO_ID,
            modelPhoto: model.MODEL_PHOTO_URL,
            typeName: type.TYPE_NAME
        }

        /** Return the model object */
        return responseObject;
    } catch(error) {
        /** Log and return error */
        console.log("ERROR: There is an error retrieving model's information:", error);
        return "There is an error retrieving model's information."
    }
}

/** Export the modules */
module.exports = {
    GetModelInfoByModelId
}
