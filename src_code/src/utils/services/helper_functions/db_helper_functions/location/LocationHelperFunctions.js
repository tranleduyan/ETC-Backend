/**
 * Retrieves location information by ID from the database.
 * @param {Object} db - The database connection object.
 * @param {string} locationId - The ID of the location to retrieve information for.
 * @returns {Promise<Object|null|string>} - A promise that resolves to an object containing location information,
 *                                           or null if the location does not exist, or a string if an error occurs.
 */
async function GetLocationInformationById(db, locationId) {
  try{
    /** Create Promise to get location information and readers together at once */
    const locationInfoPromise = db("location").select("LOCATION_NAME").where("PK_LOCATION_ID", "=", locationId).first();
    const locationReadersPromise = db("reader_location").select("PK_READER_TAG_ID AS antennaId").where("FK_LOCATION_ID", "=", locationId);

    /** Perform promise */
    const [locationInfo, locationReaders] = await Promise.all([locationInfoPromise, locationReadersPromise]);
    
    /** If location not exist, return null */
    if(!locationInfo) {
      return null;
    }

    /** Return result */
    return {
      locationId: locationId,
      locationName: locationInfo.LOCATION_NAME,
      locationAntennas: locationReaders,
      antennaCount: locationReaders.length
    }
  } catch(error) {
    /** If error, log and return error */
    console.log("ERROR: There is an error while retrieving location information:", error);
    return "There is an error while retrieving location information."
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
    const allLocations = await db("location").select("PK_LOCATION_ID AS locationId");
    
    /** If there is no location */
    if(allLocations && allLocations.length === 0) {
      return null;
    }

    const getLocationInfoPromises = [];
    for(const location of allLocations) {
      getLocationInfoPromises.push(GetLocationInformationById(db, location.locationId));
    }

    /** Perform get information for all locations */
    const locations = await Promise.all(getLocationInfoPromises);

    /** Check if any result is a string, return the string if found */
    const errorResult = locations.find(result => typeof result === 'string');
    if (errorResult) {
      return errorResult;
    }

    /** If there is location, return the list of locations */
    return locations;
  } catch(error) {
    /** Log and return error */
    console.log(`ERROR: There is an error while retrieving all locations:`, error);
    return "There is an error while retrieving all locations."
  }
}

module.exports = {
  GetAllLocations,
  GetLocationInformationById
}