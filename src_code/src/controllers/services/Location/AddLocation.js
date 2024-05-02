/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Adds a new location and sends a response.
 * 
 * @param {Object} res - The response object.
 * @param {Object} req - The request object containing the location name.
 * @returns {Object} - The response object.
 */
async function AddLocation(res, req) {
  try{
    /** Validate before processing */
    const errors = await Promise.resolve(ValidateAddLocation(res, req));
    if(errors) {
      return errors;
    }

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

async function ValidateAddLocation(res, req) {
  try{
    /** Extract schoolId and locationName from request body */
    const { schoolId, locationName } = req;

    /** If missing required fields, return Missing Content */
    if(!schoolId || !locationName) {
      return responseBuilder.MissingContent(res);
    }

    /** Get user information */
    const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId)); 

    /** If user not found, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If user is not admin, return 400 */
    if(user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(res, "Only administrator can perform this action.");
    }

    /** Get existed location with the location name */
    const existedLocation = await db("location").select("LOCATION_NAME").where("LOCATION_NAME", "=", locationName.trim()).first();

    /** If there is a location with the requested location name, return 400 because location name must be unique */
    if(existedLocation) {
      return responseBuilder.BadRequest(res, "This location is already added. Location name must be unique.");
    }

    /** Return null, indicating pass validation */
    return null;
  } catch(error){
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while adding ${req?.body?.locationName} into location:`, error);
    return responseBuilder.ServerError(res, `There is an error while adding ${req?.body?.locationName} into location.`);
  }
}

/** Exports the module */
module.exports = {
  AddLocation
}
