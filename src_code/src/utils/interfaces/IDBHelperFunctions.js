/** Initialize neccessary module */
const userDBHelperFunctions = require("../services/helper_functions/db_helper_functions/user/UserDBHelperFunctions");
const typeDBHelperFunctions = require("../services/helper_functions/db_helper_functions/type/TypeDBHelperFunctions");
const modelDBHelperFunctions = require("../services/helper_functions/db_helper_functions/model/ModelDBHelperFunctions");

/** Exports the functions */
module.exports = {
    GetUserInfoByEmailAddress: userDBHelperFunctions.GetUserInfoByEmailAddress,
    GetUserInfoBySchoolId: userDBHelperFunctions.GetUserInfoBySchoolId,
    GetTypeInfoByName: typeDBHelperFunctions.GetTypeInfoByName,
    AddTypeToDatabase: typeDBHelperFunctions.AddTypeToDatabase,
    GetTypeInfoByTypeId: typeDBHelperFunctions.GetTypeInfoByTypeId,
    GetModelInfoByModelId: modelDBHelperFunctions.GetModelInfoByModelId,
}
