/** Intitialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieves information about a specific location.
 * 
 * @param {Object} res - The response object to send HTTP response.
 * @param {string} locationId - The ID of the location to retrieve information for.
 * @returns {Promise<Object>} - A promise that resolves to a successful response containing location information,
 *                              or an error response if there is any issue with the retrieval process.
 */
async function GetLocationInformation(res, locationId) {
  try {
    /** Get the location information */
    const location = await Promise.resolve(dbHelper.GetLocationInformationById(db, locationId));

    /** If there is no location, return 404 */
    if(!location) {
      return responseBuilder.NotFound(res, "Location");
    }

    /** Return successful response */
    return responseBuilder.GetSuccessful(res, location, "Location");
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while retrieving location information:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving location information.");
  }
}

/** Export the module */
module.exports = {
  GetLocationInformation
}