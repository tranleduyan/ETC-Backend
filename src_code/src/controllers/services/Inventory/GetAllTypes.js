/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");

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
 *      typeId: int,
 *      typeName: string
 * }
 */
async function GetAllTypes(res) {
    try {
        /** Retrieving types */
        const types = await db("equipment_type").select(
            "PK_TYPE_ID as typeId",
            "TYPE_NAME as typeName",
        ).orderBy("typeName");

        /** If there is no types at all, return not found */
        if(!types || types.length === 0) {
            return responseBuilder.BuildResponse(res, 404, {
                message:"There isn't any existed type. Please add more."
            })
        }

        /** If there is type and get successfully, return 200 */
        return responseBuilder.GetSuccessful(res, types, "All types");
    } catch(error) {
        /** Log and return 503 */
        console.log("ERROR: There is an error while retrieving all types: ", error);
        return responseBuilder.ServerError(res, "There is an error while retrieving all types.");
    }
}

/** Exports the module */
module.exports = {
    GetAllTypes
}
