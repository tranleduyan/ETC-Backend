const signInService = require('../services/Authentication/SignIn');
const signUpService = require('../services/Authentication/SignUp');
const sendVerificationCodeService = require("../services/Authentication/SendVerificationCode");
module.exports = {
    SignIn: signInService.SignIn,
    SignUp: signUpService.SignUp,
    SendVerificationCode: sendVerificationCodeService.SendVerificationCode,
}
