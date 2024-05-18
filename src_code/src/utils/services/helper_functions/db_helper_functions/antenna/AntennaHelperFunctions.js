/**
 * Retrieves information about all antennas.
 *
 * @param {Object} db - The database connection object.
 *
 * @returns {Promise<Array<Object>|null|string>} - Returns a Promise that resolves to:
 *  - An array of objects containing information about all antennas.
 *  - `null` if no antennas are found.
 *  - A string error message if an error occurs during the query.
 *
 * @throws {Error} - Logs and returns a string error message in case of any unexpected errors.
 */
async function GetAllAntennas(db) {
  try {
    /** Get All Antennas including their information */
    const allAntennas = await db("reader_location")
      .select(
        "reader_location.PK_READER_TAG_ID AS antennaId",
        "location.LOCATION_NAME AS locationName"
      )
      .leftJoin(
        "location",
        "location.PK_LOCATION_ID",
        "=",
        "reader_location.FK_LOCATION_ID"
      );

    /** If there is no antennas, return null */
    if (allAntennas && allAntennas.length === 0) {
      return null;
    }

    /** Return all antennas */
    return allAntennas;
  } catch (error) {
    /** If error, log error and return error */
    console.log(
      "ERROR: There is an error while retrieving all antennas:",
      error
    );
    return "There is an error while retrieving all antennas.";
  }
}

/**
 * Retrieves information about a specific antenna by its ID.
 *
 * @param {Object} db - The database connection object.
 * @param {number|string} antennaId - The ID of the antenna to retrieve information for.
 *
 * @returns {Promise<Object|null|string>} - Returns a Promise that resolves to:
 *  - An object containing the antenna information if found.
 *  - `null` if no antenna is found with the given ID.
 *  - A string error message if an error occurs during the query.
 *
 * @throws {Error} - Logs and returns a string error message in case of any unexpected errors.
 */
async function GetAntennaInformationById(db, antennaId) {
  try {
    /** Perform get antenna information */
    const antenna = await db("reader_location")
    .select(
      "reader_location.PK_READER_TAG_ID AS antennaId",
      "location.LOCATION_NAME AS locationName"
    )
    .leftJoin(
      "location",
      "location.PK_LOCATION_ID",
      "=",
      "reader_location.FK_LOCATION_ID"
    )
    .where(
      "reader_location.PK_READER_TAG_ID", 
      "=",
      antennaId
    )
    .first();

    /** If antenna not found, return null */
    if(!antenna) {
      return null;
    }

    /** If antenna found, return it */
    return antenna;
  } catch(error) {
    /** If error, log error and return error string */
    console.log("ERROR: There is an error while retrieving antenna information:", error);
    return "There is an error while retrieving antenna information.";
  }
}

/** Export the modules */
module.exports = {
  GetAllAntennas,
  GetAntennaInformationById
};
