/** Initalize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const userServices = require("../controllers/interfaces/IUser");

/** Initialize router for the route */
const router = express.Router();

/**
 *  GET/RETRIEVE USER APPROVED RESERVATION
 *  URL => /api/user/{schoolId}/approved-reservation
 */
router.get("/:schoolId/approved-reservation", async (request, response) => {
  try {
    /** Get user id */
    const schoolId = request.params.schoolId;

    /** Perform Get User Approve Reservation */
    return await Promise.resolve(
      userServices.GetApprovedReservation(response, schoolId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      `ERROR: There is an error while retrieving ${request.params.userId}'s approved reservation:`,
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving your approved reservation."
    );
  }
});

/**
 *  GET/RETRIEVE USER APPROVED RESERVATION
 *  URL => /api/user/{schoolId}/requested-reservation
 */
router.get("/:schoolId/requested-reservation", async (request, response) => {
  try {
    /** Get user id */
    const schoolId = request.params.schoolId;

    /** Perform Get User Approve Reservation */
    return await Promise.resolve(
      userServices.GetRequestedReservation(response, schoolId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      `ERROR: There is an error while retrieving ${request.params.userId}'s approved reservation:`,
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving your approved reservation."
    );
  }
});

/** Exports the router */
module.exports = router;
