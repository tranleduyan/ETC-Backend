/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");

/**
 * Retrieves user information and usage statistics based on the provided school ID.
 * @param {Object} res - The response object for sending HTTP responses.
 * @param {number} schoolId - The school ID to retrieve user information and usage for.
 * @returns {Promise<Object>} A promise resolving to an HTTP response with user usage data.
 * @throws {Error} If there is an error while retrieving user information or usage statistics.
 */
async function GetUserUsage(res, schoolId) {
  try {
    /** Get User Information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId));

    /** If user not exist, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** Retrieve user usage */
    const userUsage = await Promise.resolve(dbHelper.GetUserUsage(db, schoolId));

    /** If error while retrieving user usage, return error */
    if(userUsage && typeof userUsage === "string") {
      return responseBuilder.ServerError(res, userUsage);
    }

    /** Return successful get message */
    return responseBuilder.GetSuccessful(res, userUsage, "User usage");
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while retrieving user equipment usage:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving user equipment usage.");
  }
}

/** Exports the module */
module.exports = {
  GetUserUsage
}