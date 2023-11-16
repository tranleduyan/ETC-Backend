const signInService = require('../services/Authentication/SignIn');
const signUpService = require('../services/Authentication/SignUp')
module.exports = {
    SignIn: signInService.SignIn,
    SignUp: signUpService.SignUp,
}
