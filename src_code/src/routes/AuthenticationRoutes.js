/** Initalize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const authenticationServices = require("../controllers/interfaces/IAuthentication");
/** Initialize router for the route */
const router = express.Router();

/**
 *  POST/SIGN IN
 *  URL => /api/authentication/sign-in
 */
router.post("/sign-in", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** If request body is exist, then we perform sign in based on request body */
    return await Promise.resolve(
      authenticationServices.SignIn(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while signing-in: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while sign in."
    );
  }
});

/**
 *  POST/SIGN UP
 *  URL => /api/authentication/sign-up
 */
router.post("/sign-up", async (req, res) => {
  try {
    /** If there is no request body, return missing request body */
    if (!req.body || Object.keys(req.body).length === 0) {
      return responseBuilder.MissingContent(res, "RB");
    }
    /** return response to the client */
    return await Promise.resolve(authenticationServices.SignUp(res, req.body));
  } catch (error) {
    /** If error, return log to cloudwatch and response with server error status code 503 message (more on the code see responsive builder) */
    console.log("ERROR: There is an error occur while signing up: ", error);
    return responseBuilder.ServerError(
      res,
      "Sorry, an error occur while signing up."
    );
  }
});

/**
 *  POST/SEND VERIFICATION CODE
 *  URL => /api/authentication/send-verification-code
 */
router.post("/send-verification-code", async (req, res) => {
  try {
    /** If there is no request body, return missing request body */
    if (!req.body || Object.keys(req.body).length === 0) {
      return responseBuilder.MissingContent(res, "RB");
    }
    /** return response to the client */
    return await Promise.resolve(
      authenticationServices.SendVerificationCode(res, req.body)
    );
  } catch (error) {
    /** If error, return log to cloudwatch and response with server error message status code 503 */
    console.log(
      "ERROR: There is an error occur while sending verification code: ",
      error
    );
    return responseBuilder.ServerError(
      res,
      "Sorry, an error occur while sending verification code."
    );
  }
});

module.exports = router;
