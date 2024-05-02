/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Retrieves all locations and sends a response.
 * 
 * @param {Object} res - The response object.
 * @returns {Object} - The response object.
 */
async function GetAllLocations(res) {
  try{
    /** Get all locations */
    const allLocations = await Promise.resolve(dbHelpers.GetAllLocations(db));

    /** If there is no location exists, return 400 */
    if(!allLocations) {
      return responseBuilder.BadRequest(res, "There isn't any existed location. Please add more.");
    }

    /** If there is error while getting all locations, return errors */
    if(typeof allLocations === "string") {
      return responseBuilder.ServerError(res, allLocations);
    }

    /** Return Get Successful response */
    return responseBuilder.GetSuccessful(res, allLocations, "All locations");
  } catch(error){
    /** If error, log and return 503 */
    console.log("ERROR: There is an error while retrieving all location information.");
    return responseBuilder.ServerError(res, "There is an error while retrieving all locations.");
  }
}

module.exports = {
  GetAllLocations
}
