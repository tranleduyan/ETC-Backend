/** Initalize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const locationServices = require("../controllers/interfaces/ILocation");

/** Initialize router for the route */
const router = express.Router();

/**
 * POST/ADD NEW LOCATION
 * URL => /api/location/create
 * 
 * Request Body: 
 * {
 *    "schoolId": "string",
 *    "locationName": "string"
 * }
 * 
 * Response Object: 
 * [
 *    {
 *        "locationId": number,
 *        "locationName": "string"
 *    }
 * ] 
 */
router.post("/create", async(request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if(!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Return response */
    return await locationServices.AddLocation(response, request.body);
  } catch(error){
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while adding ${request?.body?.locationName} into location:`, error);
    return responseBuilder.ServerError(response, `There is an error while adding ${request?.body?.locationName} into location.`)
  }
})

/**
 * GET/RETRIEVING ALL LOCATIONS
 * URL => /api/location/
 * 
 * Response Object: 
 * [
 *    {
 *        "locationId": number,
 *        "locationName": "string",
 *        "locationAntennas": [
 *            {
 *                antennaId: number
 *            }
 *          ],
 *        "antennaCount": number
 *    }
 * ] 
 */
router.get("/", async(_, response) => {
  try{
    return await locationServices.GetAllLocations(response);
  } catch(error){
    console.log(`ERROR: There is an error while retrieving all locations:`, error);
    return responseBuilder.ServerError(response, `There is an error while retrieving all locations.`);
  }
})

/** Exports the router */
module.exports = router;
