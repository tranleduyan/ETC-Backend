/** Import necessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Adds a new RFID antenna and sends a response.
 * 
 * @param {Object} res - The response object.
 * @param {Object} req - The request object containing the antennaId and locationId.
 * @returns {Object} - The response object.
 */
async function AddRFIDAntenna(res, req) {
  try{
    /** Validate information before processing */
    const errors = await Promise.resolve(ValidateAddRFIDAntenna(res, req));
    if(errors) {
      return errors;
    }

    /** Extract antennaId and locationId from request body */
    const { antennaId, locationId } = req;

    /** Create insert data for insertion */
    const insertData = {
      PK_READER_TAG_ID: antennaId.trim(), 
      FK_LOCATION_ID: locationId ? locationId : null
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

/**
 * Validates the data for adding a new RFID antenna.
 * 
 * @param {Object} res - The response object.
 * @param {Object} req - The request object containing the schoolId and antennaId.
 * @returns {Object|null} - The response object if validation fails, otherwise null.
 */
async function ValidateAddRFIDAntenna(res, req) {
  try{
    /** Extract schoolId and locationName from request body */
    const { schoolId, antennaId } = req;

    /** If missing required fields, return Missing Content */
    if(!schoolId || !antennaId) {
      return responseBuilder.MissingContent(res);
    }

    /** Get user information */
    const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId)); 

    /** If user not found, return 404 */
    if(!user) {
      return responseBuilder.NotFound(res, "User");
    }

    /** If user is not admin, return 400 */
    if(user.userRole === "Student" || user.userRole === "Faculty") {
      return responseBuilder.BadRequest(res, "Only administrator can perform this action.");
    }

    /** If there is antenna with the same requested id, return 400 */
    const existedAntenna = await db("reader_location").select("PK_READER_TAG_ID").where("PK_READER_TAG_ID", "=", antennaId.trim()).first();
    if(existedAntenna) {
      return responseBuilder.BadRequest(res, "This antenna already exists. RFID Antenna ID must be unique.")
    }
    
    /** If invalid location id, return 400 */
    if(req.locationId && typeof req.locationId !== "number") {
      return responseBuilder.BadRequest(res, "Invalid type of location.")
    }
    
    if(req.locationId) {
      const location = await db("location").select("PK_LOCATION_ID").where("PK_LOCATION_ID", "=", req.locationId).first();
      if(!location) {
        return responseBuilder.BadRequest(res, "Location not exists.");
      }
    }
    
    /** Return null indicating successful */
    return null;
  } catch(error) {
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while validating adding new antenna:`, error);
    return responseBuilder.ServerError(res, "There is an error while adding this antenna.");
  }
}

/** Export the module */
module.exports = {
  AddRFIDAntenna,
}
