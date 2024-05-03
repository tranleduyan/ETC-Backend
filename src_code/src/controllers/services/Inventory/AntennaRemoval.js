/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

async function AntennaRemoval(res, req) {
  try {
    /** Validate before processing */
    const errors = await Promise.resolve(ValidateAntennaRemoval(res, req));

    /** If failed validation, return errors */
    if(errors) {
      return errors;
    }

    /** Extract antennaIds from request body */
    const { antennaIds } = req;
    await db("reader_location").whereIn("PK_READER_TAG_ID", antennaIds).del();

    /** Return successful response */
    return responseBuilder.DeleteSuccessful(res, "Antennas");
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while deleting antennas:", error);
    return responseBuilder.ServerError(res, "There is an error while deleting antennas.")
  }
}

async function ValidateAntennaRemoval(res, req) {
  try {
    /** Extract schoolId and antennaIds from request body */
    const { schoolId, antennaIds } = req;

    /** If missing fields, return missing content */
    if(!schoolId || !antennaIds) {
      return responseBuilder.MissingContent(res);
    }

    /** If invalid type of antennaIds and schoolId, return 400 */
    if(!Array.isArray(antennaIds) || typeof schoolId !== "string") {
      return responseBuilder.BadRequest(res, "Invalid type request.");
    }

    /** If no antennaIds in list, there is nothing to do */
    if(antennaIds.length === 0) {
      return responseBuilder.BadRequest(res, "No changes was made.")
    }

    /** Get user information */
    const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId));

    /** If user not found, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If user is not administrator, return 400 */
    if(user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(res, "Only administrator can perform this action.");
    }

    /** Return null to indicate successful */
    return null;
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while validating deleting antennas:", error);
    return responseBuilder.ServerError(res, "There is an error while deleting antennas.")
  }
}

/** Exports the module */
module.exports = {
  AntennaRemoval
}