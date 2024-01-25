const generalHelperFunctions = require("../services/helper_functions/general_helper_functions/GeneralHelperFunctions");

module.exports ={
    SendVerificationCode: generalHelperFunctions.SendVerificationCode,
    ValidateAdminUser: generalHelperFunctions.ValidateAdminUser,
    GenerateDriveImagePublicUrl: generalHelperFunctions.GenerateDriveImagePublicUrl,
    DeleteDriveImage: generalHelperFunctions.DeleteDriveImage,
    DeleteDriveImages: generalHelperFunctions.DeleteDriveImages,
    RestoreDeletedDriveImage: generalHelperFunctions.RestoreDeletedDriveImage
 }
 