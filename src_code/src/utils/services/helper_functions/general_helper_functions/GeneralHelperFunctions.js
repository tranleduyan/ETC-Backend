/** Initialize neccessary modules */
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const dbHelper = require("../../../../utils/interfaces/IDBHelperFunctions");
const db = require("../../../../configurations/database/DatabaseConfigurations");

/**
 * Sends a verification code to the specified email address.
 *
 * @param {string} firstName - The first name of the recipient.
 * @param {string} lastName - The last name of the recipient.
 * @param {string} emailAddress - The email address to which the verification code is sent.
 * @param {string} verificationCode - The verification code to be sent.
 * @returns {Promise<null|string>} - A promise that resolves to `null` if the email is sent successfully,
 *                                  otherwise a string containing an error message.
 */
async function SendVerificationCode(firstName, lastName, emailAddress, verificationCode) {
    /** Initialize and get ETC Logo image path for email content */
    const imagePath = path.join(
        __dirname,
        "../../../../assets/ETCLogo.png"
    );

    /** Create Nodemailer Transporter */
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "ecstoolcheckout@gmail.com",
            pass: process.env.EMAIL_APP_PW /** This is app password code for ecs gmail account when use nodemailer */
        }
    });

    /** Define email message */
    const mailOptions = {
        from: "ECS Tool Checkout <ecstoolcheckout@gmail.com>",
        to: emailAddress,
        subject: `${verificationCode} is your verification code`,
        html: `
        <html>
        <head>
            <style>
            .container {
                text-align: center;
            }
            </style>
        </head>
        <body>
            <div class="container">
            <img src="cid:ETCLogo" alt="Chef's Compass Image">
            </div>
            <div class="container">
            <h1>${verificationCode}</h1>
            </div>
            <div class="message">
            <p>Dear ${firstName} ${lastName}, <br/> <br/> 
                This is your ECS Tool Checkout verification code. If you did not request this code, it is possible that someone else is trying to use your email address to access ECS Tool Checkout. <br/> <br/> 
                <strong> DO NOT FORWARD OR GIVE THIS CODE TO ANYONE. </strong> <br/> <br/> 
                Sincerely yours, <br/> The ETC team </p> 
            </div>
        </body>
        </html>
        `,
        attachments: [
        {
            filename: "ETCLogo.png",
            path: imagePath,
            cid: "ETCLogo",
        },
        ],
    };
    /** Send the email */
    try {
        await transporter.sendMail(mailOptions);
        return null;
    } catch (error) {
        return `ERROR: There is an error occur during sending verification code to email: ${error}`;
    }
}

/**
 * Generates a public URL for an image stored on Google Drive using the provided Drive file ID.
 * @param {object} drive - The Google Drive API instance.
 * @param {string} imageDriveFileId - The file ID of the image on Google Drive.
 * @returns {Promise<string|null>} - A promise resolving to the public URL of the image on success or an error message on failure.
 */
async function GenerateDriveImagePublicUrl(drive, imageDriveFileId) {
    try{
        /** Set permission of the image to public */
        await drive.permissions.create({
            fileId: imageDriveFileId,
            requestBody: {
              role: "reader",
              type: "anyone",
            },
        });

        /** Once set the image to public, retrieve its data (include the image public url) */
        const imageUrl = `https://lh3.googleusercontent.com/u/0/d/${imageDriveFileId}`;

        /** Return the image public url */
        return imageUrl;
    } catch(error) {
        /** Log the error and return null to indicate no image url is generated */
        console.log("ERROR: There is an error while generating drive image url: ", error);
        return null;
    }
}

/**
 * Deletes an image from Google Drive using the provided Drive file ID.
 * @param {object} drive - The Google Drive API instance.
 * @param {string} imageDriveFileId - The file ID of the image on Google Drive.
 * @returns {Promise<null|string>} - A promise resolving to null on success or an error message on failure.
 */
async function DeleteDriveImage(drive, imageDriveFileId) {
    try {
        /** If no image drive file id is given then return null */
        if(!imageDriveFileId) {
            return null;
        }

        /** Retrieve the file metadata to check if the image exists */
        const imageFile = await drive.files.get({ fileId: imageDriveFileId });
        if (!imageFile || !imageFile.data) {
            return null;
        }

        /** Attempt to delete the image from Google Drive */
        await drive.files.update({
            fileId: imageDriveFileId,
            requestBody: {
                trashed: true,
            },
        });
  
        /** Return null on successful deletion */
        return null;
    } catch (error) {
        /** Log the error and return an error message */
        console.log(`ERROR: There is an error occur while deleting image with id ${imageDriveFileId}: `, error);
        return "An error occurs while deleting image.";
    }
}

/**
 * Deletes multiple image files from Google Drive and moves them to the trash.
 * 
 * @param {Object} drive - The Google Drive API instance.
 * @param {string[]} imageDriveFileIds - An array of image file IDs to be deleted.
 * @returns {string|null} - Returns null on successful deletion or an error message on failure.
 */
async function DeleteDriveImages(drive, imageDriveFileIds) {
    try{
        /** Ensure that imageDriveFileIds is an array and is not empty */
        if (!Array.isArray(imageDriveFileIds) || imageDriveFileIds.length === 0) {
            return null;
        }

        /** Create Promises */
        const deletePromises = imageDriveFileIds.map(async (fileId) => {
            try {
                 /** Check if the image file exists */
                 const imageFile = await drive.files.get({ fileId: fileId });

                 /** If the image file is not found, log an error and skip deletion */
                 if (!imageFile || !imageFile.data) {
                     console.log(`ERROR: Image with ID ${fileId} not found.`);
                     return `Image with ID ${fileId} not found.`;
                 }

                /** Attempt to delete the image from Google Drive and move to trash */
                await drive.files.update({
                    fileId: fileId,
                    requestBody: {
                        trashed: true,
                    },
                });
            } catch (error) {
                /** Log the error for the specific image, but continue with the deletion of other images */
                console.log(`ERROR: There is an error occur while deleting image with id ${fileId}: `, error);
                return `An error occurs while deleting image.`;
            }
        });

        /** Wait for all delete operations to complete */
        const results = await Promise.all(deletePromises); 

        /** Check if any individual delete operation encountered an error */
        const errorResult = results.find((result) => typeof result === 'string'); 
        if(errorResult) {
            return errorResult;
        }

        /** Return null on successful deletion */
        return null;
    } catch(error) {
        /** Log the error and return an error message */
        console.log(`ERROR: There is an error occur while deleting image with id ${imageDriveFileIds}: `, error);
        return "An error occurs while deleting images.";
    }
}

/**
 * Restores a deleted image file from Google Drive trash.
 * 
 * @param {Object} drive - The Google Drive API instance.
 * @param {string} imageDriveFileId - The ID of the image file to be restored.
 * @returns {string|null} - Returns null on successful restoration or an error message on failure.
 */
async function RestoreDeletedDriveImage(drive, imageDriveFileId) {
    try{
        /** If no image drive file id is given then return null */
        if(!imageDriveFileId) {
            return null;
        } 

        /** Retrieve the file metadata to check if the image exists */
        const imageFile = await drive.files.get({ fileId: imageDriveFileId });
        if (!imageFile || !imageFile.data) {
            return null;
        }

        /** Update the file metadata to restore it from the trash */
        await drive.files.update({
            fileId: imageDriveFileId,
            requestBody: {
                trashed: false,
            },
        });
    
        /** Return null on successful restoration */
        return null;
    } catch(error) {
        /** Log the error and return an error message */
        console.error(`Error restoring image with ID ${imageDriveFileId}:`, error);
        return "An error occurs while restoring the data.";
    }
}

/** 
 * Validates a user based on the provided school ID, checking for validity and admin privileges.
 *
 * @param {string} schoolId - The school ID associated with the user.
 * @returns {string|null} - A validation message or null if the user is valid.
 *    - Returns a string if there's an invalid request, error in retrieving user information,
 *      user not found, or insufficient permissions.
 *    - Returns null to indicate that the user is valid.
 */
async function ValidateAdminUser(schoolId) {
    /** Ensure that schoolId should always be string */
    if(typeof schoolId !== "string") {
        return "Invalid type of school id.";
    }
        
    /** Ensure school id is valid numeric */
    if(isNaN(parseInt(schoolId, 10))) {
        return "Invalid school id.";
    }

    /** Retrieve user information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId));

    /** If there is error while retrieve user information, return error */
    if(typeof user === "string") {
        return user;
    }

    /** If user is not exist, return not found message */
    if(!user) {
        return "User not found.";
    }

    /** Ensure user is an admin */
    if(user.userRole !== "Admin"){
        return "You don't have permission to perform this action.";
    }

    /** Return null to indicate user is valid */
    return null;
}

/** Exports the modules */
module.exports = {
    SendVerificationCode,
    GenerateDriveImagePublicUrl,
    DeleteDriveImage,
    DeleteDriveImages,
    RestoreDeletedDriveImage,
    ValidateAdminUser
}
