const express = require('express');
const userRoute = express.Router();

const UserService = require('../Service/UserService');
const { JSONResponse } = require('../Constants/Response');
const {logger} = require('../Config/winston');
const { Constants } = require('../constants');


userRoute.get('/', function(req, res, next) {
    res.json({
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        userType: req.user.userType,
        address: req.user.addresses.find(i => i.isSelected == true),
    })
});

userRoute.post('/fcmToken', function(req, res) {
    UserService.updateFCMToken(req.user.token, req.body.fcmToken, function(error, success, statusCode) {
        if(error) {
            res.status(statusCode).json(new JSONResponse(error).getJson());
        }
        res.status(statusCode).json(new JSONResponse(null, success).getJson());
    })
})

userRoute.post('/update', async function(req, res) {
    try {
        await UserService.UpdateUserDetails(req.user._id, req.body.email, req.body.firstName, req.body.lastName, req.body.phoneNumber);
        res.json(new JSONResponse(null, Constants.SuccessMessages.UpdatedUserDetails).getJson());
    }
    catch (err) {
        logger.error(err);
        res.status(500).status(new JSONResponse(Constants.ErrorMessages.InternalServerError).getJson());
    }
})

module.exports = userRoute;