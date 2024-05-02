/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handles the removal of locations from the database.
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing locationIds and schoolId.
 * @returns {Promise<Object>} - A promise that resolves to a successful response if the locations are removed successfully,
 *                              or an error response if there is any issue.
 */
async function LocationRemoval(res, req) {
  /** Initiates a database transaction */
  const trx = await db.transaction();
  try{
    /** Validates the request */
    const errors = await Promise.resolve(ValidateLocationRemoval(res, req));
    
    /** Returns errors if validation fails */
    if(errors) {
      return errors;
    }

    const { locationIds } = req;

    /** Deletes locations */
    await trx("location").whereIn("PK_LOCATION_ID", locationIds).del();

    /** Commits the transaction */
    await trx.commit();

    /** Returns success response */
    return responseBuilder.DeleteSuccessful(res, "Locations");
  } catch(error){
    /** If error, roll back, log error and return 503 */
    await trx.rollback();
    console.log("ERROR: There is an error while removing locations:", error);
    return responseBuilder.ServerError(res, "There is an error while removing locations.");
  }
}

/**
 * Validates the request for location removal.
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing locationIds and schoolId.
 * @returns {Promise<Object|null>} - A promise that resolves to null if the request is valid,
 *                                    or an error response if there is any issue with the validation.
 */
async function ValidateLocationRemoval(res, req) {
  try {
    const { schoolId, locationIds } = req;

    /** Returns missing content error if locationIds or schoolId are missing */
    if(!locationIds || !schoolId) {
      return responseBuilder.MissingContent(res);
    }

    /** Returns bad request error if locationIds is not an array */
    if(!Array.isArray(locationIds) || typeof schoolId !== "string") {
      return responseBuilder.BadRequest(res, "Invalid request type.");
    }

    /**  Returns success response if no locations are provided because nothing to delete */
    if(locationIds.length === 0) {
      return responseBuilder.DeleteSuccessful(res, "Locations");
    }

    /** Retrieves user information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId));
    
    /** If user not found, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If user is student, faculty, return 400 */
    if(user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(res, "Only administrator can perform this action.");
    }    

    /** Return null to indicate success */
    return null;
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while validating location removal:", error);
    return responseBuilder.ServerError(res, "There is an error while removing locations.")
  }
}

module.exports = {
  LocationRemoval
}