/** Import necessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieves all antennas
 * @param {Object} res - The response object to send HTTP response.
 * @returns {Promise<Object>} - A promise that resolves to an object containing all antennas,
 *                              or an error response if there is any issue.
 */
async function GetAllAntennas(res) {
  try{
    const allAntennas = await dbHelpers.GetAllAntennas(db);
    if(!allAntennas) {
      return responseBuilder.BadRequest(res, "There isn't any existed antenna. Please add more.");
    }

    return responseBuilder.GetSuccessful(res, allAntennas, "All antennas");
  } catch(error) {
    console.log("ERROR: There is an error while retrieving all antennas:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving all antennas.");
  }
}

/** Export the module */
module.exports = {
  GetAllAntennas
}