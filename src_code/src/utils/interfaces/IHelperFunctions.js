/** Import neccessary modules */
const generalHelperFunctions = require("../services/helper_functions/general_helper_functions/GeneralHelperFunctions");

/** Exports the functions */
module.exports = {
  SendVerificationCode: generalHelperFunctions.SendVerificationCode,
  ValidateAdminUser: generalHelperFunctions.ValidateAdminUser,
  GenerateDriveImagePublicUrl:
    generalHelperFunctions.GenerateDriveImagePublicUrl,
  DeleteDriveImage: generalHelperFunctions.DeleteDriveImage,
  DeleteDriveImages: generalHelperFunctions.DeleteDriveImages,
  RestoreDeletedDriveImage: generalHelperFunctions.RestoreDeletedDriveImage,
  ConvertHEXStringToNumber: generalHelperFunctions.ConvertHEXStringToNumber,
  ConvertNumberToHEXString: generalHelperFunctions.ConvertNumberToHEXString
};
