async function GetAllAntennas(db) {
  try {
    /** Get All Antennas including their information */
    const allAntennas = await db("reader_location").select(
      "reader_location.PK_READER_TAG_ID AS antennaId",
      "location.LOCATION_NAME AS locationName"
    )
    .leftJoin("location", "location.PK_LOCATION_ID", "=", "reader_location.FK_LOCATION_ID");

    /** If there is no antennas, return null */
    if(allAntennas && allAntennas.length === 0) {
      return null;
    }

    /** Return all antennas */
    return allAntennas;
  } catch(error) {
    /** If error, log error and return error */
    console.log("ERROR: There is an error while retrieving all antennas:", error);
    return "There is an error while retrieving all antennas."
  }
}

module.exports = {
  GetAllAntennas
}