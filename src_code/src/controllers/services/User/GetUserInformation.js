/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");

/**
 * Retrieves user information from the database based on the provided school ID.
 * 
 * @param {object} res - The response object to send the response.
 * @param {string} schoolId - The school ID used to retrieve user information.
 * @returns {Promise<object>} - A promise that resolves to an object containing user information.
 * @throws {Error} - Throws an error if there's an issue retrieving user information from the database.
 */
async function GetUserInformation(res, schoolId) {
  try {
    /** Retrieve user */
    const userInformation = await db("user_info")
      .select(
        db.raw("COALESCE(FIRST_NAME, '') AS firstName"),
        db.raw("COALESCE(MIDDLE_NAME, '') AS middleName"),
        db.raw("COALESCE(LAST_NAME, '') AS lastName"),
        db.raw("COALESCE(TAG_ID, '') AS tagId"),
        "EMAIL_ADDRESS AS emailAddress",
        "SCHOOL_ID AS schoolId",
        db.raw("CONCAT(COALESCE(FIRST_NAME, ''), ' ', COALESCE(LAST_NAME, ''), ' - ID: ', COALESCE(SCHOOL_ID, 'Not Found')) AS fullNameId")
      )
      .where("SCHOOL_ID", "LIKE", schoolId?.trim())
      .first();

    /** If user not exists, return 404 */
    if(!userInformation) {
      return responseBuilder.NotFound(res, "User");
    }

    /** Return successful message */
    return responseBuilder.GetSuccessful(res, userInformation, "User");
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while retrieving user information:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving the information.");
  }
}

/** Exports the module */
module.exports = {
  GetUserInformation
}