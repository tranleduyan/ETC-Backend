/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");

/**
 * Retrieves the list of approved reservations for a given school ID.
 *
 * @param {Object} response - The HTTP response object.
 * @param {string} schoolId - The unique identifier of the user.
 * @returns {Object} HTTP response containing the list of approved reservations or an error message.
 */
async function GetApprovedReservation(response, schoolId) {
  try {
    /** Retrieve user information based on school ID */
    const user = await dbHelper.GetUserInfoBySchoolId(db, schoolId);

    /** If user does not exist, return a not found response */
    if (!user) {
      return responseBuilder.NotFound(response, "User");
    }

    const approveReservationList = await dbHelper.GetApprovedReservationList(
      db,
      schoolId
    );

    /** If the user don't have any approved reservation */
    if (!approveReservationList) {
      return responseBuilder.BuildResponse(response, 200, {
        message: "You don't have any approved reservation.",
      });
    }

    if (typeof approveReservationList === "string") {
      return responseBuilder.ServerError(response, approveReservationList);
    }

    /** Return response */
    return responseBuilder.GetSuccessful(
      response,
      approveReservationList,
      "Approved reservation"
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      `ERROR: There is an error occur while retrieving ${userId}'s approved reservation:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      `Sorry, there is an error occur while retrieving your approved reservation list.`
    );
  }
}

/** Exports the modules */
module.exports = {
  GetApprovedReservation,
};
