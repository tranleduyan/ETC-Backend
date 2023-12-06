/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const inventoryServices = require('../controllers/interfaces/IInventory');
/** Initialize router for the route */
const router = express.Router();

/**
 *  POST/EQUIPMENT REMOVE
 *  URL => /api/inventory/remove
 */
router.post('/remove', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform remove based on request body */
        return await Promise.resolve(inventoryServices.EquipmentRemoval(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while removing: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while removing.");
    }
})

/**
 *  POST/MODEL ADDITION
 *  URL => /api/inventory/model-add
 */
router.post('/model-add', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform model add based on request body */
        return await Promise.resolve(inventoryServices.ModelAddition(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while model adding: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while model adding.");
    }
})

/**
 *  POST/TYPE ADDITION
 *  URL => /api/inventory/type-add
 */
router.post('/type-add', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform type add based on request body */
        return await Promise.resolve(inventoryServices.TypeAddition(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while type adding: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while type adding.");
    }
})

module.exports = router;