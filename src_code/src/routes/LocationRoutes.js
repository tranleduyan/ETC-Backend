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
router.post("/create", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Return response */
    return await locationServices.AddLocation(response, request.body);
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      `ERROR: There is an error while adding ${request?.body?.locationName} into location:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      `There is an error while adding ${request?.body?.locationName} into location.`
    );
  }
});

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
router.get("/", async (_, response) => {
  try {
    return await locationServices.GetAllLocations(response);
  } catch (error) {
    console.log(
      `ERROR: There is an error while retrieving all locations:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      `There is an error while retrieving all locations.`
    );
  }
});

/**
 * DELETE/REMOVING LOCATIONS
 * URL => /api/location/
 */
router.delete("/", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Perform action */
    return await locationServices.LocationRemoval(response, request.body);
  } catch (error) {
    /** If error, log and return error */
    console.log(`ERROR: There is an error while deleting locations:`, error);
    return responseBuilder.ServerError(
      response,
      `There is an error while deleting locations.`
    );
  }
});

/**
 * PUT/UPDATE LOCATION INFORMATION (NAME)
 * URL => /api/location/{locationId}
 *
 * Request Body:
 * {
 *    "schoolId": string,
 *    "newLocationName": string
 * }
 */
router.put("/:locationId", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Retrieve locationId */
    const locationId = request.params.locationId;

    return await locationServices.LocationUpdate(
      response,
      request.body,
      locationId
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while updating location information:",
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while updating location information."
    );
  }
});

/**
 * GET/RETRIEVING LOCATION INFORMATION
 * URL => /api/location/{locationId}
 *
 * Response Object:
 * {
 *    "locationId": number,
 *    "locationName": string,
 *    "locationAntennas": [
 *        {
 *            "antennaId": string
 *        }
 *     ],
 *    "antennaCount": number,
 *    "usageHistory": [
 *        {
 *            "scanTime": time,
 *            "studentTagId": string,
 *            "scanHistoryId": number,
 *            "fullName": string
 *        }
 *    ],
 *    locationEquipments: [
 *        {
 *            "serialId": string,
 *            "typeName": string,
 *            "modelPhoto": string,
 *            "reservationStatus": string
 *        }
 *    ]
 * }
 */
router.get("/:locationId", async (request, response) => {
  try {
    /** Retrieve locationId */
    const locationId = request.params.locationId;

    return await locationServices.GetLocationInformation(response, locationId);
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while retrieving location information:",
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving location information."
    );
  }
});

/** Exports the router */
module.exports = router;
