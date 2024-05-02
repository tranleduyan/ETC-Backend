/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

async function AddLocation(res, req) {
  try{

    /** Extract location name from request body */
    const { locationName } = req;

    /** Create insertData object for inserting */
    const insertData = {
      LOCATION_NAME: locationName.trim()
    }

    /** Add new data */
    await db("location").insert(insertData);

    /** Retrieve list of all locations for return */
    const allLocations = await Promise.resolve(dbHelpers.GetAllLocations(db));

    /** If allLocations === null, return 400 */
    if(!allLocations) {
      return responseBuilder.BadRequest(res, "There isn't any existed location. Please add more.");
    }
    
    /** If error while retrieving all locations, return 503 */
    if(typeof allLocations === "string") {
      return responseBuilder.ServerError(res, allLocations);
    }

    /** Return successful message */
    return responseBuilder.CreateSuccessful(res, allLocations, "A location")
  } catch(error){
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while adding location:`, error);
    return responseBuilder.ServerError(res, "There is an error while adding location.");
  }
}

module.exports = {
  AddLocation
}