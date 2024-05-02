/** Initalize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const locationServices = require("../controllers/interfaces/ILocation");

/** Initialize router for the route */
const router = express.Router();

/**
 * POST/ADD NEW LOCATION
 * URL => /api/location/create
 */
router.post("/create", async(request, result) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if(!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Return response */
    return await locationServices.AddLocation(result, request.body);
  } catch(error){
    /** If error, log error and return 503 */
    console.log(`ERROR: There is an error while adding ${request?.body?.locationName} into location:`, error);
    return responseBuilder.ServerError(res, `There is an error while adding ${request?.body?.locationName} into location.`)
  }
})

/** Exports the router */
module.exports = router;
