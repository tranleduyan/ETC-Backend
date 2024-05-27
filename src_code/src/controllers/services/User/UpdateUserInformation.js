/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const gHelper = require("../../../utils/interfaces/IHelperFunctions");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const path = require("path");
const fs = require('fs');

/**
 * Get Tag ID Tracker 
 */
async function GetAvailableTagID() {
  const start = 4096;
  const end = 8191;
  const allNumbers = Array.from({ length: end - start + 1 }, (_, i) => i + start);

  const existingNumbers = await db("user_info")
      .select("TAG_ID")
      .orderBy("TAG_ID", "ASC");

  // Map existingNumbers to an array of strings
  const existingNumbersArray = existingNumbers.map(obj => obj.TAG_ID);

  // Convert HEX string to numbers
  const existingNumbersAsNumbers = existingNumbersArray.map(hexString => gHelper.ConvertHEXStringToNumber(hexString));

  // Filter the available numbers
  const availableNumbers = allNumbers.filter(number => !existingNumbersAsNumbers.includes(number));

  if (availableNumbers.length === 0) {
      return null;
  }

  const hexAvailableNumbers = gHelper.ConvertNumberToHEXString(availableNumbers[0]);
  if(!hexAvailableNumbers){
    return null;
  }
  return hexAvailableNumbers;
}

/**
 * Validates the length of a name.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} name - The name to be validated.
 * @param {string} [type="First"] - The type of the name, default is "First".
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function ValidateNameLength(res, name, type="First") { 
  if(name.length > 25) {
      if(type === "First") {
          return responseBuilder.BadRequest(res, "First name is longer than 25 characters.");
      }
      return responseBuilder.BadRequest(res, "Last name is longer than 25 characters.");
  }

  /** Indicate pass the validation */
  return null;
}

/**
 * Validates the email address.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} emailAddress - The email address to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function ValidateEmail(res, emailAddress, userId) {
  /** Declare a email pattern ends with @spu.edu (regex) */
  const emailPattern = /.+@spu\.edu$/;

  /** Check if emailAddress ends with @spu.edu */
  if(!emailPattern.test(emailAddress.trim())){
    return responseBuilder.BadRequest(res, "Please enter a valid spu email address.");
  }

  /** Retrieve user with the sign up email address to check for the uniqueness */
  const isUserWithRequestEmail = await Promise.resolve(dbHelper.GetUserInfoByEmailAddress(db, emailAddress.trim()));

  /** Check if the isUserWithRequestEmail is not null and if it type is string, return bad request */
  if(isUserWithRequestEmail && typeof isUserWithRequestEmail === "string") {
    return responseBuilder.BadRequest(res, isUserWithRequestEmail);
  }
  /** If there is already an user with the sign up email address, return bad request */
  if(isUserWithRequestEmail.userId !== userId) { 
      return responseBuilder.BadRequest(res,"The email address is already in used.");
  }

  /** Indicate pass the validation */
  return null;
}

async function ValidateSchoolId(res, schoolId, userId) {
  /** Declare a schoolId pattern */
  const schoolIdPattern = /^\d{9}$/;

  /** Verifying if the school id is valid */
  if(schoolId.length !== 9 || !schoolIdPattern.test(schoolId)) {
    return responseBuilder.BadRequest(res, "Invalid school ID.");
  }

  /** Retrieve user with the new school id to check for the uniqueness */
  const isUserWithRequestSchoolId = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId.trim()));

  if(isUserWithRequestSchoolId && typeof isUserWithRequestSchoolId === "string") {
    return responseBuilder.BadRequest(res, isUserWithRequestSchoolId);
  }

  /** If there is already an user with the sign up school id, return bad request */
  if(isUserWithRequestSchoolId && isUserWithRequestSchoolId.userId !== userId) {
    return responseBuilder.BadRequest(res, "School ID is already used.");
  }

  /** Indicate pass the validation */
  return null;    
}

async function ValidateTagId(res, tagId, userId) {
  /** If there is no tag id, then we don't have to do anything */
  if(tagId === null) {
    return;
  }

  const availableTagId = await GetAvailableTagID(); 
  if(!availableTagId) {
    return responseBuilder.BadRequest(res, "There is no available tag id. Remove some.")
  }

  /** Convert tagId from HEX to number */
  const tagIdDec = gHelper.ConvertHEXStringToNumber(tagId.trim());
  
  if(typeof tagIdDec === "string") {
    return responseBuilder.BadRequest(res, tagIdDec);
  } 

  /** If new tag id out of range, return 400 */
  if(tagIdDec < 4096 || tagIdDec > 8191) {
    return responseBuilder.BadRequest(res, `Student tag ID must be from #1000 to #1FFF. Available Tag ID: ${availableTagId}`);
  } 

  /** Check if tag id is exists */
  const userWithNewTagId = await db("user_info")
    .select("PK_USER_ID AS userId")
    .where("TAG_ID", "LIKE", tagId.trim())
    .first();

  if(userWithNewTagId && userWithNewTagId.userId !== userId) {
    return responseBuilder.BadRequest(res, `Tag ID already exists. Available Tag ID: ${availableTagId}`);
  }
}

async function ValidateFaculty(res, req, user) {
  try { 
    /** Extract variables from request body */
    const { targetSchoolId, firstName, middleName, lastName, emailAddress, newSchoolId, tagId } = req;

    /** Ensure required fields are filled */
    if(!targetSchoolId || !firstName || !lastName || !emailAddress || !newSchoolId) {
      return responseBuilder.MissingContent(res);
    }
    
    /** Ensure no update on school id */
    if(targetSchoolId.trim() !== newSchoolId.trim()) {
      return responseBuilder.BadRequest(res, "Invalid request.");
    }

    if(targetSchoolId.trim() !== user.schoolId.trim()) {
      return responseBuilder.BadRequest(res, "Contact lab administrator to help you.");
    } 

    /** Ensure no update on tag id */
    if(user.tagId && !tagId) {
      return responseBuilder.BadRequest(res, "Contact lab administrator to help you.");
    }

    if(tagId && !user.tagId) {
      return responseBuilder.BadRequest(res, "Contact lab administrator to help you.");
    } 

    if(tagId && user.tagId && (tagId.trim() !== user.tagId.trim())) {
      return responseBuilder.BadRequest(res, "Contact lab administrator to help you.");
    }

    /** Ensure that name field is valid */
    const firstNameError = ValidateNameLength(res, firstName);
    const secondNameError = ValidateNameLength(res, lastName, "Last")
    if(firstNameError){
      return firstNameError;
    }

    if(secondNameError) {
      return secondNameError;
    }

    /** Ensure that email address field is valid */
    if(emailAddress.trim() !== user.emailAddress.trim()) {
      const emailAddressError = ValidateEmail(res, emailAddress.trim(), user.userId)
      if(emailAddressError) {
        return emailAddressError;
      }
    }

    /** Indicate pass the validation */
    return null;
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while validating faculty:", error);
    return responseBuilder.ServerError(res, "There is an error while updating information.");
  }
}

async function ValidateAdmin(res, req, user) {
  /** Extract variables from request body */
  const { targetSchoolId, firstName,middleName, lastName, emailAddress, newSchoolId, tagId } = req;

  /** Ensure required fields are filled */
  if(!targetSchoolId || !firstName || !lastName || !emailAddress || !newSchoolId) {
    return responseBuilder.MissingContent(res);
  }

  const targetUser = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, targetSchoolId.trim()));

  if(!targetUser) {
    return responseBuilder.NotFound(res, "User");
  }

  /** Validate name */
  const firstNameError = ValidateNameLength(res, firstName);
  const secondNameError = ValidateNameLength(res, lastName, "Last")
  if(firstNameError){
    return firstNameError;
  }

  if(secondNameError) {
    return secondNameError;
  }

  /** Validate email */
  if(emailAddress.trim() !== user.emailAddress.trim()) {
    const emailAddressError = await ValidateEmail(res, emailAddress.trim(), targetUser.userId)
    if(emailAddressError) {
      return emailAddressError;
    }
  }

  /** Validate new school id */
  if(newSchoolId.trim() !== targetSchoolId) {
    const newSchoolIdError = await ValidateSchoolId(res, newSchoolId.trim(), targetUser.userId);

    if(newSchoolIdError) {
      return newSchoolIdError;
    }
  }
  
  /** Validate tagId */
  if(tagId?.trim() !== targetUser.tagId?.trim()) {
    const tagIdError = await ValidateTagId(res, tagId, targetUser.userId);
    if(tagIdError) {
      return tagIdError;
    }
  }

  /** Return null to indicate successful */
  return null;
}

async function ValidateUpdateUserInformation(res, req, schoolId) {
  try {
    /** Get User Information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId.trim()));

    /** If user not exists, return 404 */
    if(!user) {
      return responseBuilder.NotFound("User");
    }

    if(user.userRole === "Student") { 
      return responseBuilder.BadRequest(res, "Contact lab administrator to help you.");
    } else if (user.userRole === "Faculty") {
      return await Promise.resolve(ValidateFaculty(res, req, user));
    } 
    
    return await Promise.resolve(ValidateAdmin(res, req, user));
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error occur while updating user information:", error);
    return responseBuilder.ServerError(res, "There is an error while updating information.");
  }
}

async function UpdateUserInformation(res, req, schoolId) {
  try {
    const errors = await ValidateUpdateUserInformation(res, req, schoolId);
    if(errors) {
      return errors;
    }
    
    const { targetSchoolId, firstName, middleName, lastName, emailAddress, newSchoolId, tagId} = req;

    const updateData = {
      FIRST_NAME: firstName.trim(),
      MIDDLE_NAME: middleName ? middleName.trim() : null,
      LAST_NAME: lastName.trim(),
      EMAIL_ADDRESS: emailAddress.trim(),
      SCHOOL_ID: newSchoolId.trim(),
      TAG_ID: tagId ? tagId.trim() : null
    }

    await db("user_info")
      .update(updateData)
      .where("SCHOOL_ID", "LIKE", targetSchoolId.trim());

      const userInfo = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, newSchoolId.trim()))

    return responseBuilder.BuildResponse(res, 200, {
      message: "Information update successfuly.",
      responseObject:userInfo
    })
   
  } catch(error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while updating user information:", error);
    return responseBuilder.ServerError(res, "There is an error while updating user information.")
  }
}

/** Export the modules */
module.exports = {
  UpdateUserInformation
}