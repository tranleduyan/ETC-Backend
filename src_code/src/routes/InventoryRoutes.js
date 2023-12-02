/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const inventoryServices = require('../controllers/interfaces/IInventory')
/** Initialize router for the route */
const router = express.Router();


module.exports = router;
