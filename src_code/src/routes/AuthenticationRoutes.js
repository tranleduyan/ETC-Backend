/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const authenticationServices = require('../controllers/interfaces/IAuthentication')
/** Initialize router for the route */
const router = express.Router();

/**
 *  POST/SIGN IN
 *  URL => /api/authentication/sign-in
 */
router.post('/sign-in', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform sign in based on request body */
        return await authenticationServices.SignIn(response, request.body);
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while signing-in: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while sign in.");
    }
})
/**
 *  POST/SIGN UP 
 *  URL => /api/authentication/sign-up
 */
router.post("/sign-up", async(req, res) => {
    try{
         /** If there is no request body, return missing request body */
        if (!req.body || Object.keys(req.body).length === 0) {
            return responseBuilder.MissingContent(res, "RB");
        }
        /** return response to the client */
        return await authenticationServices.SignUp(res, req.body);
    }catch(error){
        /** If error, return log and response with server error message */
        console.log("ERROR: There is an error occur during signing in: ", error);
        return responseBuilder.ServerError(
        res,
        "Sorry, an error occur during signing in."
        );
    }
})

module.exports = router;