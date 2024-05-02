/** Import necessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

async function AddRFIDAntenna(res, req) {
  try{
    /** Extract antennaId and locationId from request body */
    const { antennaId, locationId } = req;

    /** Create insert data for insertion */
    const insertData = {
      PK_READER_TAG_ID: antennaId, 
      FK_LOCATION_ID: locationId
    }

    /** Insert new antenna */
    await db("reader_location").insert(insertData);

    /** Return successful response. */
    return responseBuilder.CreateSuccessful(res, null, "An antenna");
  } catch(error){
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while adding ${req?.antennaId} into antennas:`, error);
    return responseBuilder.ServerError(res, "There is an error while adding this RFID antenna.")
  }
}

/** Export the module */
module.exports = {
  AddRFIDAntenna,
}
