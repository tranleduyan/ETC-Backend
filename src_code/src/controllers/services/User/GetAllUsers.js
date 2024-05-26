/** Import necessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");

/**
 * Retrieves all users from the database.
 * 
 * @param {object} res - The response object to send the response.
 * @returns {Promise<Array>} - A promise that resolves to an array of user objects.
 * @throws {Error} - Throws an error if there's an issue retrieving users from the database.
 */
async function GetAllUsers(res) {
  try {
    const allUsers = await db("user_info")
      .select(
        db.raw("COALESCE(FIRST_NAME, '') AS firstName"),
        db.raw("COALESCE(MIDDLE_NAME, '') AS middleName"),
        db.raw("COALESCE(LAST_NAME, '') AS lastName"),
        db.raw("COALESCE(TAG_ID, '') AS tagId"),
        "EMAIL_ADDRESS AS emailAddress",
        "SCHOOL_ID AS schoolId",
        db.raw("CONCAT(COALESCE(FIRST_NAME, ''), ' ', COALESCE(LAST_NAME, ''), ' - ID: ', COALESCE(SCHOOL_ID, 'Not Found')) AS fullNameId")
      )
      .orderBy([
        { column: "lastName", order: "ASC" },
        { column: "firstName", order: "ASC" },
        { column: "middleName", order: "ASC" }
      ]);

    return responseBuilder.GetSuccessful(res, allUsers, "All users");
  } catch (error) {
    console.log("ERROR: There is an error while retrieving all users:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving all users.");
  }
}

/** Exports the module */
module.exports = {
  GetAllUsers,
}