/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const inventoryServices = require('../controllers/interfaces/IInventory');

/** Initialize router for the route */
const router = express.Router();

/**
 * PUT/UPDATE EQUIPMENT
 * URL => /api/inventory/equipment/{serialId}
 * requestBody:
 *  {
 *      "schoolId": string,
 *      "typeId": int (optional),
 *      "modelId": int (optional),
 *      "maintenanceStatus": string (optional),
 *      "reservationStatus": string (optional),
 *      "usageCondition": string (optional),
 *      "purchaseCost": double (optional),
 *      "purchaseDate": date (optional)
 *  }
 * 
 * @return 404 or 400 if failed validation
 * @return 503 if server error
 * @return 200 OK 
 * {
 *      "message":"Equipment updated successfully."
 * }
 */
router.put('/equipment/:serialId', async(request, response) => {
    try {
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        }
        /** Retrieve type id of the requested update type */
        const serialId = request.params.serialId;
        /** Perform update type */
        return await Promise.resolve(inventoryServices.EquipmentUpdate(response, request.body, serialId));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while updating equipment:", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while updating equipment.");
    }
});

/** Exports the router */
module.exports = router;
