/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Updates the name of a location in the database.
 * 
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing the new location name.
 * @param {string} locationId - The ID of the location to be updated.
 * @returns {Promise<Object>} - A promise that resolves to a success response if the location is updated successfully,
 *                              or an error response if there is any issue.
 */
async function LocationUpdate(res, req, locationId) {
  try{
    /** Validating the request */
    const errors = await Promise.resolve(ValidateLocationUpdate(res, req, locationId));

    /** If failed validation, return errors */
    if(errors) {
      return errors;
    }
    
    /** Retrieve newLocationName from request bodt */
    const { newLocationName } = req;
    await db("location")
      .where("PK_LOCATION_ID", locationId)
      .update({ LOCATION_NAME: newLocationName });

    /** Return success response */
    return responseBuilder.UpdateSuccessful(res, null, "Location");
  } catch(error){
    /** If error, log error, and return 503 */
    console.log("ERROR: There is an error while update location information:", error);
    return responseBuilder.ServerError(res, "There is an error while updating location information.");
  }
}

/**
 * Validates the request to update the location information.
 * 
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing schoolId and newLocationName.
 * @param {string} locationId - The ID of the location to be updated.
 * @returns {Promise<Object|null>} - A promise that resolves to null if the request passes validation,
 *                                    or an error response if there is any issue with the validation.
 */
async function ValidateLocationUpdate(res, req, locationId) {
  try {
    /** retrieve schoolId and newLocationName from request body */
    const { schoolId, newLocationName } = req;

    /** If missing schoolId, return missing content */
    if(!schoolId) {
      return responseBuilder.MissingContent(res);
    }

    /** If no newLocationName provided, there is nothing to do */
    if(!newLocationName) {
      return responseBuilder.BadRequest(res, null, "No changes is made.");
    }

    /** Create promise to retrieve user information, location information, and exist location to ensure no duplicate name during update */
    const userPromise = dbHelpers.GetUserInfoBySchoolId(db, schoolId);
    const locationPromise = dbHelpers.GetLocationInformationById(db, locationId);
    const existLocationPromise = db("location").select("LOCATION_NAME").where("LOCATION_NAME", "=", newLocationName.trim()).first();

    /** Perform promise at once */
    const [user, location, existLocation] = await Promise.all([userPromise, locationPromise, existLocationPromise]);

    /** If no user found, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If no location found, return 404 */
    if(!location) {
      return responseBuilder.NotFound(res, "Location");
    }
    
    /** If role is Student or Faculty, they have no rights to update location information */
    if(user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(res, "Only administrator can perform this action.")
    }

    /** If new location name already in used, return 400 */
    if(existLocation) {
      return responseBuilder.BadRequest(res, "This location name already exists. Location name must be unique.");
    }

    /** Return null to indicate pass validation */
    return null;
  } catch(error) {
    /** If errors, log errors and return 503 */
    console.log("ERROR: There is an error while validating update location information:", error);
    return responseBuilder.ServerError(res, "There is an error while updating location information.");
  }
}

/** Export the modules */
module.exports = {
  LocationUpdate
}