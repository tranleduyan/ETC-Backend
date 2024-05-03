/**
 * Retrieves location information by ID from the database.
 * @param {Object} db - The database connection object.
 * @param {string} locationId - The ID of the location to retrieve information for.
 * @returns {Promise<Object|null|string>} - A promise that resolves to an object containing location information,
 *                                           or null if the location does not exist, or a string if an error occurs.
 */
async function GetLocationInformationById(db, locationId) {
  try {
    /** Create Promise to get location information and readers together at once */
    const locationInfoPromise = db("location")
      .select("LOCATION_NAME")
      .where("PK_LOCATION_ID", "=", locationId)
      .first();
    const locationReadersPromise = db("reader_location")
      .select("PK_READER_TAG_ID AS antennaId")
      .where("FK_LOCATION_ID", "=", locationId);
    const scanHistoryPromise = db
      .select(
        "scan_history.SCAN_TIME AS scanTime",
        "scan_history.FK_SCHOOL_TAG_ID AS studentTagId",
        "scan_history.PK_SCAN_HISTORY_ID AS scanHistoryId",
        db.raw(
          "CONCAT(user_info.LAST_NAME, ', ', user_info.FIRST_NAME) AS fullName"
        )
      )
      .from("scan_history")
      .leftJoin(
        "reader_location",
        "reader_location.PK_READER_TAG_ID",
        "=",
        "scan_history.FK_LOCATION_ROOM_READER_ID"
      )
      .leftJoin(
        "location",
        "location.PK_LOCATION_ID",
        "=",
        "reader_location.FK_LOCATION_ID"
      )
      .leftJoin(
        "user_info",
        "user_info.TAG_ID",
        "=",
        "scan_history.FK_SCHOOL_TAG_ID"
      )
      .where("reader_location.FK_LOCATION_ID", "=", locationId)
      .orderBy("scan_history.SCAN_TIME", "DESC")
      .limit(50);

    const locationEquipmentsPromise = db("equipment_home")
      .select(
        "equipment.PK_EQUIPMENT_SERIAL_ID AS serialId",
        "equipment_type.TYPE_NAME AS typeName",
        "equipment_model.MODEL_NAME AS modelName",
        "equipment_model.MODEL_PHOTO_URL AS modelPhoto",
        "equipment.RESERVATION_STATUS AS reservationStatus"
      )
      .leftJoin(
        "equipment",
        "equipment.PK_EQUIPMENT_SERIAL_ID",
        "=",
        "equipment_home.FK_EQUIPMENT_SERIAL_ID"
      )
      .leftJoin(
        "equipment_type",
        "equipment_type.PK_TYPE_ID",
        "=",
        "equipment.FK_TYPE_ID"
      )
      .leftJoin(
        "equipment_model",
        "equipment_model.PK_MODEL_ID",
        "=",
        "equipment.FK_MODEL_ID"
      )
      .where("equipment_home.FK_LOCATION_ID", "=", locationId)
      .orderBy("typeName")
      .orderBy("modelName")
      .orderBy("serialId");

    /** Perform promise */
    const [locationInfo, locationReaders, usageHistory, locationEquipment] =
      await Promise.all([
        locationInfoPromise,
        locationReadersPromise,
        scanHistoryPromise,
        locationEquipmentsPromise,
      ]);

    /** If location not exist, return null */
    if (!locationInfo) {
      return null;
    }

    /** Remove modelName property from each element in locationEquipments */
    locationEquipment.forEach((equipment) => {
      delete equipment.modelName;
    });

    /** Return result */
    return {
      locationId: locationId,
      locationName: locationInfo.LOCATION_NAME,
      locationAntennas: locationReaders,
      antennaCount: locationReaders.length,
      scanHistory: usageHistory,
      locationEquipment: locationEquipment,
    };
  } catch (error) {
    /** If error, log and return error */
    console.log(
      "ERROR: There is an error while retrieving location information:",
      error
    );
    return "There is an error while retrieving location information.";
  }
}

/**
 * Retrieves all locations from the database.
 *
 * @param {Object} db - The database connection object.
 * @returns {Array|null|string} - An array containing all locations, or null if there are no locations,
 * or a string indicating an error message.
 */
async function GetAllLocations(db) {
  try {
    /** Retrieve all locations */
    const allLocations = await db("location").select(
      "PK_LOCATION_ID AS locationId"
    );

    /** If there is no location */
    if (allLocations && allLocations.length === 0) {
      return null;
    }

    const getLocationInfoPromises = [];
    for (const location of allLocations) {
      getLocationInfoPromises.push(
        GetLocationInformationById(db, location.locationId)
      );
    }

    /** Perform get information for all locations */
    const locations = await Promise.all(getLocationInfoPromises);

    /** Check if any result is a string, return the string if found */
    const errorResult = locations.find((result) => typeof result === "string");
    if (errorResult) {
      return errorResult;
    }

    const sanitizedLocations = locations.map((location) => {
      /** Create a copy of the location object excluding unwanted fields */
      const { scanHistory, locationEquipment, ...sanitizedLocation } = location;
      return sanitizedLocation;
    });

    /** If there is location, return the list of locations */
    return sanitizedLocations;
  } catch (error) {
    /** Log and return error */
    console.log(
      `ERROR: There is an error while retrieving all locations:`,
      error
    );
    return "There is an error while retrieving all locations.";
  }
}

/** Exports the module */
module.exports = {
  GetAllLocations,
  GetLocationInformationById,
};
