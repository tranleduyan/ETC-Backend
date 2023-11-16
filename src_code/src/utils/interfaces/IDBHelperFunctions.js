/** Initialize neccessary module */
const userDBHelperFunctions = require("../services/helper_functions/db_helper_functions/UserDBHelperFunctions");

/** Exports the functions */
module.exports = {
    GetUserInfoByEmailAddress: userDBHelperFunctions.GetUserInfoByEmailAddress,
    GetUserInfoByStudentId: userDBHelperFunctions.GetUserInfoByStudentId
}