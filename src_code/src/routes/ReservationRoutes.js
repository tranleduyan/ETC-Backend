/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const reservationServices = require('../controllers/interfaces/IReservation');

/** Initialize router for the route */
const router = express.Router();

/**
 * POST/Making Reservation
 * URL => /api/reservation/create
 * Request Body: 
 * {
 *  "startDate":"2024-01-08",
 *  "endDate":"2024-01-010",
 *  "schoolId": "800281127",
 *  "reservedEquipments": 
 *  [
 *      {
 *          "modelId": 57,
 *          "typeId": 89,
 *          "quantity": 1
 *      },
 *              {
 *          "modelId": 58,
 *          "typeId": 89,
 *          "quantity": 1
 *      }
 *  ]
 * }
 *  @return 200 OK 
 *  @return 400 If failed validation: 
 *      - If user is student: 
 *          - Cannot making more reservation in the same period when they have more than 2 items reserved.
 *      - Date Validation
 *      - Reserved Equipment list Validation
 *  @return 503 If server error
 */
router.post("/create", async(request, response) => {
    try {
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 

        /** If request body is exist, then we perform model add based on request body */
        return await Promise.resolve(reservationServices.MakeReservation(response, request.body));
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while creating reservation:", error);
        return responseBuilder.ServerError(res, "There is an error while creating your reservation.");
    }
})

/** Export the router */
module.exports = router;