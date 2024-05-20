/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Updates information about a specific antenna.
 *
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing the updated antenna information.
 * @param {string} antennaId - The ID of the antenna to be updated.
 * @returns {Promise<Object>} - A promise that resolves to a success response if the antenna is updated successfully,
 *                              or an error response if there is any issue with the update process.
 */
async function AntennaUpdate(res, req, antennaId) {
  try {
    /** If failed validation, return errors */
    const errors = await Promise.resolve(
      ValidateAntennaUpdate(res, req, antennaId)
    );
    if (errors) {
      return errors;
    }

    /** Extract information from request body */
    const { newAntennaId, locationId } = req;

    /** Update antenna */
    await db("reader_location")
      .where("PK_READER_TAG_ID", "=", antennaId.trim())
      .update({
        PK_READER_TAG_ID: newAntennaId.trim(),
        FK_LOCATION_ID: locationId,
      });

    /** Return successful message */
    return responseBuilder.UpdateSuccessful(res, null, "Antenna");
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while updating antenna information:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while updating antenna information."
    );
  }
}

/**
 * Validates the request to update antenna information.
 *
 * @param {Object} res - The response object to send HTTP response.
 * @param {Object} req - The request object containing the updated antenna information.
 * @param {string} antennaId - The ID of the antenna to be updated.
 * @returns {Promise<Object|null>} - A promise that resolves to null if the request passes validation,
 *                                    or an error response if there is any issue with the validation.
 */
async function ValidateAntennaUpdate(res, req, antennaId) {
  try {
    /** Extract information from request body */
    const { schoolId, newAntennaId, locationId } = req;

    /** If missing required fields, return missing content */
    if (!newAntennaId && !schoolId) {
      return responseBuilder.MissingContent(res);
    }

    /** If location id is specified, ensure location exists. */
    if (locationId) {
      const location = await Promise.resolve(
        dbHelpers.GetLocationInformationById(db, locationId)
      );

      /** If location not found, return 404 */
      if (!location) {
        return responseBuilder.NotFound(res, "Location");
      }
    }

    /** Prepare promises to get user information, and antenna information */
    const userPromise = dbHelpers.GetUserInfoBySchoolId(db, schoolId);
    const antennaInformationPromise = db("reader_location")
      .select("FK_LOCATION_ID")
      .where("PK_READER_TAG_ID", "=", antennaId.trim())
      .first();
    const newAntennaExistedPromise = db("reader_location")
      .select("FK_LOCATION_ID", "PK_READER_TAG_ID")
      .where("PK_READER_TAG_ID", "=", newAntennaId.trim())
      .first();

    /** Perform promises at once */
    const [user, antennaInformation, newAntennaExisted] = await Promise.all([
      userPromise,
      antennaInformationPromise,
      newAntennaExistedPromise,
    ]);

    /** If user not exists, we cannot perform this action, return 404 */
    if (!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If antenna is not exists, we cannot perform this action, return 404 */
    if (!antennaInformation) {
      return responseBuilder.NotFound(res, "Antenna");
    }

    if (newAntennaExisted && newAntennaId.trim() !== antennaId.trim()) {
      return responseBuilder.BadRequest(
        res,
        "This antenna ID already exists. RFID Antenna ID must be unique."
      );
    }

    /** If user is not administrator, we cannot let them perform this action,  */
    if (user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(
        res,
        "Only administrator can perform this action."
      );
    }

    /** If user make no changes, then we don't need to do anything. */
    if (
      antennaId.trim() === newAntennaId.trim() &&
      locationId === parseInt(antennaInformation.FK_LOCATION_ID, 10)
    ) {
      return responseBuilder.BuildResponse(res, 200, {
        message: "No changes was made",
      });
    }

    /** Return null indicating information is valid */
    return null;
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while validating updating antenna information:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while updating antenna information."
    );
  }
}

/** Exports the module */
module.exports = {
  AntennaUpdate,
};
