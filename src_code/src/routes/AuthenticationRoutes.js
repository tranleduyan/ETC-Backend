/** Initalize neccessary modules */
const express = require('express');
const responseBuider = require('../utils/interfaces/IResponseBuilder');
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
            return responseBuider.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform sign in based on request body */
        return await authenticationServices.SignIn(response, request.body);
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while signing-in: ", error);
        /** Response error message to the client */
        return responseBuider.ServerError(response, "There is an error while sign in.");
    }
})

module.exports = router;

