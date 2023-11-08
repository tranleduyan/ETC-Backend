/** Initialize neccessary module */
const dbHelperFunctions = require("../services/helper_functions/db_helper_functions/DBHelperFunctions");

/** Exports the functions */
module.exports = {
    GetUserInfoBasedOnEmailAddress: dbHelperFunctions.GetUserInfoBasedOnEmailAddress,
}