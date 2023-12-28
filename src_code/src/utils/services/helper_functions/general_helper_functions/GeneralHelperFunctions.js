/** Initialize neccessary modules */
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

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
        const imageUrl = `https://drive.google.com/uc?id=${imageDriveFileId}`;

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
      if(!imageDriveFileId) {
        return null;
      }
      
      /** Attempt to delete the image from Google Drive */
      await drive.files.delete({
        fileId: imageDriveFileId,
      });
  
      /** Return null on successful deletion */
      return null;
    } catch (error) {
      /** Log the error and return an error message */
      console.log("ERROR: There is an error occur while deleting image: ", error);
      return "An error occurs while processing the data.";
    }
  }
  
/** Exports the module/functions */
module.exports = {
    SendVerificationCode,
    GenerateDriveImagePublicUrl,
    DeleteDriveImage,
}
