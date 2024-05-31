/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const gHelper = require("../../../utils/interfaces/IHelperFunctions");

/**
 * Function to get the next available tag ID for equipment.
 * It searches for available tag IDs in the range 0 to 4095.
 *
 * @returns {Promise<string|null>} - A promise that resolves to the next available tag ID in hexadecimal format, or null if no tag IDs are available.
 */
async function GetAvailableTagIDEquipment() {
  const start = 0;
  const end = 4095;
  const allNumbers = Array.from({ length: end - start + 1 }, (_, i) => i + start);

  const existingNumbers = await db("equipment")
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
 * Function to get the next available tag ID for students.
 * It searches for available tag IDs in the range 4096 to 8191.
 *
 * @returns {Promise<string|null>} - A promise that resolves to the next available tag ID in hexadecimal format, or null if no tag IDs are available.
 */
async function GetAvailableTagIDStudent() {
  const start = 4096;
  const end = 8191;
  const allNumbers = Array.from(
    { length: end - start + 1 },
    (_, i) => i + start
  );

  const existingNumbers = await db("user_info")
    .select("TAG_ID")
    .orderBy("TAG_ID", "ASC");

  // Map existingNumbers to an array of strings
  const existingNumbersArray = existingNumbers.map((obj) => obj.TAG_ID);

  // Convert HEX string to numbers
  const existingNumbersAsNumbers = existingNumbersArray.map((hexString) =>
    gHelper.ConvertHEXStringToNumber(hexString)
  );

  // Filter the available numbers
  const availableNumbers = allNumbers.filter(
    (number) => !existingNumbersAsNumbers.includes(number)
  );

  if (availableNumbers.length === 0) {
    return null;
  }

  const hexAvailableNumbers = gHelper.ConvertNumberToHEXString(
    availableNumbers[0]
  );
  if (!hexAvailableNumbers) {
    return null;
  }
  return hexAvailableNumbers;
}

/**
 * Function to get both the next available tag IDs for equipment and students, and fetch detailed information of equipment and users with assigned tag IDs.
 *
 * @param {Object} res - The response object used to send the response.
 * @returns {Promise<Object>} - A promise that resolves to an object containing available tag IDs for equipment and students, and details of equipment and users.
 */
async function GetTagIdsEquipmentAndUser(res) {
  try{
    const availableEquipmentTagIdPromise = GetAvailableTagIDEquipment();
    const availableUserTagIdPromise = GetAvailableTagIDStudent();

    const getEquipmentWithTagIdPromise = db("equipment")
      .select(
        "equipment_type.TYPE_NAME AS typeName",
        "equipment_model.MODEL_NAME AS modelName",
        "equipment.PK_EQUIPMENT_SERIAL_ID AS serialId",
        "equipment.TAG_ID AS tagId"
      )
      .from("equipment_model")
      .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID")
      .leftJoin("equipment", "equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
      .whereNotNull("equipment.PK_EQUIPMENT_SERIAL_ID")
      .whereNotNull("equipment.TAG_ID")
      .orderBy("typeName")
      .orderBy("modelName")
      .orderBy("serialId");

    const getUserWithTagIdPromise =  db("user_info")
    .select(
      "SCHOOL_ID AS schoolId",
      "FIRST_NAME AS firstName",
      "LAST_NAME AS lastName",
      db.raw("IFNULL(MIDDLE_NAME, 'N/A') AS middleName"),
      "TAG_ID AS tagId"
    )
    .whereNotNull("user_info.TAG_ID")
    .orderBy("LAST_NAME")
    .orderBy("FIRST_NAME")
    .orderBy("MIDDLE_NAME");

    const [availableEquipmentTagId, availableUserTagId, equipment, users] = await Promise.all(
      [
        availableEquipmentTagIdPromise, 
        availableUserTagIdPromise, 
        getEquipmentWithTagIdPromise, 
        getUserWithTagIdPromise
      ]
    );

    const responseObject = {
      availableEquipmentTagId: availableEquipmentTagId ? availableEquipmentTagId : "No more available tag.",
      availableUserTagId: availableUserTagId ? availableUserTagId : "No more available tag.",
      equipment: equipment,
      users: users,
    }

    return responseBuilder.GetSuccessful(res, responseObject);
  } catch(error){
    console.log("ERROR: There is an error while retrieving tag ids of equipment and user:", error);
    return responseBuilder.ServerError(res, "There is an error while retrieving information.");
  }
} 

/** Export the modules */
module.exports = {
  GetTagIdsEquipmentAndUser
}