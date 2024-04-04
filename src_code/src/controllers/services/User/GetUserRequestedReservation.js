/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");

/**
 * Retrieves the list of requested reservations for a given school ID.
 *
 * @param {Object} response - The HTTP response object.
 * @param {string} schoolId - The unique identifier of the user.
 * @returns {Object} HTTP response containing the list of requested reservations or an error message.
 */
async function GetRequestedReservation(response, schoolId) {
  try {
    /** Retrieve user information based on school ID */
    const user = await dbHelper.GetUserInfoBySchoolId(db, schoolId);

    /** If user does not exist, return a not found response */
    if (!user) {
      return responseBuilder.NotFound(response, "User");
    }

    const requestedReservationList = await dbHelper.GetRequestedReservationList(
      db,
      schoolId
    );

    /** If the user don't have any approved reservation */
    if (!requestedReservationList) {
      return responseBuilder.BuildResponse(response, 200, {
        message: "You don't have any requested reservation.",
      });
    }

    if (typeof requestedReservationList === "string") {
      return responseBuilder.ServerError(response, requestedReservationList);
    }
    /** Return response */
    return responseBuilder.GetSuccessful(
      response,
      requestedReservationList,
      "Requested reservation"
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      `ERROR: There is an error occur while retrieving ${schoolId}'s requested reservation:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      `Sorry, there is an error occur while retrieving your requested reservation list.`
    );
  }
}

/** Exports the modules */
module.exports = {
  GetRequestedReservation,
};
