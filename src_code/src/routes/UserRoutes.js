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

/**
 * PUT/UPDATE STATUS OF RESERVATION TO APPROVE OR DELETE THEM
 * URL => /api/user/{schoolId}/action?type=[approve | reject | cancel]&id=[reservationId]
 */
router.put("/:schoolId/action", async (request, response) => {
  try {
    const type = request.query.type;
    const userId = request.params.schoolId;
    const reservationId = request.query.id;
    return await Promise.resolve(
      userServices.ApproveRejectCancelReservation(
        response,
        type,
        userId,
        reservationId
      )
    );
  } catch (error) {
    /** Log error and return 503 */
    console.log(
      "ERROR: There is an error while updating the reservation's status:",
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while updating the reservation's status."
    );
  }
});

/**
 * GET/RETRIEVE USER EQUIPMENT USAGE
 * URL => /api/user/{schoolId}/equipment-usage
 * 
 * Response Object: {
 *    recentlyUsed: [
 *      scanHistoryId: number,
 *      serialId: string,
 *      locationName: string,
 *      fullName: string,
 *      reservationStatus: string
 *      typeName: string,
 *      modelName: string,
 *      modelPhoto: string
 *    ],
 *    currentlyUsed: [
 *      scanHistoryId: number,
 *      serialId: string,
 *      locationName: string,
 *      fullName: string,
 *      reservationStatus: string,
 *      typeName: string,
 *      modelName: string,
 *      modelPhoto: string
 *    ]
 * }
 */
router.get("/:schoolId/equipment-usage", async (request, response) => {
  try {
    /** Get School Id */
    const schoolId = request.params.schoolId;

    /** Perform action */
    return await Promise.resolve(userServices.GetUserUsage(response, schoolId));
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while retrieving user equipment usage:", error);
    return responseBuilder.ServerError(response, "There is an error while retrieving user equipment usage.");
  }
})

/**
 * GET/RETRIEVE ALL USERS
 * URL => /api/user/
 * 
 * Response Object: [
 *    {
 *       "lastName": "string",
 *       "firstName": "string",
 *       "middleName": "string",
 *       "tagId": "string",
 *       "emailAddress": "string",
 *       "schoolId": "string",
 *       "fullNameId": "FirstName LastName - ID: schoolId"
 *    }
 * ]
 */
router.get("/", async(_, response) => {
  try {
    /** Perform action */
    return await Promise.resolve(userServices.GetAllUsers(response));
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is error while retrieving all users:", error);
    return responseBuilder.ServerError(response, "There is an error while retrieving all users.");
  }
})

/**
 * GET/RETRIEVE USER INFORMATION
 * URL => /api/user/{schoolId}
 * 
 * Response Object: {
 *       "lastName": "string",
 *       "firstName": "string",
 *       "middleName": "string",
 *       "tagId": "string",
 *       "emailAddress": "string",
 *       "schoolId": "string",
 *       "fullNameId": "FirstName LastName - ID: schoolId"
 *    }
 */
router.get("/:schoolId", async (request, response) => {
  try {
    /** Retrieve school id */
    const schoolId = request.params.schoolId;

    /** Perform action */
    return await Promise.resolve(userServices.GetUserInformation(response, schoolId));
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while retrieving user information:", error);
    return responseBuilder.ServerError(response, "There is an error while retrieving information.");
  }
})

/** 
 * PUT/UPDATE USER INFORMATION
 * URL => /api/user/{schoolId}
 * 
 * Request Body: {
 *  targetSchoolId: string (required),
 *  firstName: string (required - max 25 char),
 *  middleName: string (optional),
 *  lastName: string (required - max 25 char),
 *  emailAddress: string (required),
 *  newSchoolId: string (required)
 * }
 * 
 */
router.put("/:schoolId", async(request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    const schoolId = request.params.schoolId;
    return await Promise.resolve(userServices.UpdateUserInformation(response, request.body, schoolId));
  } catch(error){
    console.log("ERROR: There is an error while updating user information:", error);
    return responseBuilder.ServerError(response, "There is an error while updating information.")
  }
})
/** Exports the router */
module.exports = router;
