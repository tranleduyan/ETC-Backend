/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * GetAntennaInformation - Retrieves information about a specific antenna.
 *
 * @param {Object} res - The response object to send the response.
 * @param {number|string} antennaId - The ID of the antenna to retrieve information for.
 *
 * @returns {Promise<Object>} - Returns a response object based on the operation outcome.
 *  - If `antennaId` is invalid, returns a 400 Bad Request response.
 *  - If the antenna is not found, returns a 404 Not Found response.
 *  - If there is an error retrieving the antenna information, returns a 503 Server Error response.
 *  - If successful, returns a 200 OK response with the antenna information.
 *
 * @throws {Error} - Logs and returns a 503 Server Error response in case of any unexpected errors.
 */
async function GetAntennaInformation(res, antennaId) {
  try {
    /** Perform get antenna information */
    const antennaInformation = await Promise.resolve(
      dbHelpers.GetAntennaInformationById(db, antennaId)
    );

    /** If antenna not found, return 404 */
    if (!antennaInformation) {
      return responseBuilder.NotFound(res, "Antenna");
    }

    /** If error while get antenna information, return 503 */
    if (typeof antennaInformation === "string") {
      return responseBuilder.ServerError(res, antennaInformation);
    }

    /** Return Get Successful */
    return responseBuilder.GetSuccessful(
      res,
      antennaInformation,
      "Antenna information"
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while retrieved antenna information:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while retrieved information."
    );
  }
}

/** Export the module */
module.exports = {
  GetAntennaInformation,
};
