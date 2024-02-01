/** Initialize neccessary modules */
const SignInService = require('../services/Authentication/SignIn');
const SignUpService = require('../services/Authentication/SignUp');
const SendVerificationCodeService = require("../services/Authentication/SendVerificationCode");

/** Exports the module */
module.exports = {
    SignIn: SignInService.SignIn,
    SignUp: SignUpService.SignUp,
    SendVerificationCode: SendVerificationCodeService.SendVerificationCode,
}
