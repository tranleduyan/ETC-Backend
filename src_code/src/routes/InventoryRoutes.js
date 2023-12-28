/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const inventoryServices = require('../controllers/interfaces/IInventory')
/** Initialize router for the route */
const router = express.Router();

/**
 *  POST/ADD TOOL
 *  URL => /api/inventory/add
 */
router.post('/add', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform sign in based on request body */
        return await Promise.resolve(inventoryServices.AddTool(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while adding tool: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while adding tool.");
    }
})

module.exports = router;
