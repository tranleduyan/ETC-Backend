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
    const allLocations = db("location").select("PK_LOCATION_ID AS locationId", "LOCATION_NAME AS locationName");
    
    /** If there is no location */
    if(allLocations && allLocations.length === 0) {
      return null;
    }

    /** If there is location, return the list of locations */
    return allLocations;
  } catch(errors) {
    /** Log and return error */
    console.log(`ERROR: There is an error while retrieving all locations:`, error);
    return "There is an error while retrieving all locations."
  }
}

module.exports = {
  GetAllLocations
}