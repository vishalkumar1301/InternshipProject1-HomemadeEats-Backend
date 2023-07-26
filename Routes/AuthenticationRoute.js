const express = require('express');
const passport = require('passport');
const authenticationRoute = express.Router();
const multer = require('multer');

const { Constants } = require('../constants');
const { SignUpValidationRule } = require('../Validations/Rules/SignUp');
const { SignInValidationRule } = require('../Validations/Rules/SignIn');
const { SignUpValidationCheck } = require('../Validations/Checks/SignUp');
const { SignInValidationCheck } = require('../Validations/Checks/SignIn');
const UserService = require('../Service/UserService');
const { JSONResponse } = require('../Constants/Response');
const { storage } = require('../database');
var upload = multer({ storage: storage })
const User = require('../Models/user');

require('../Authentication/auth')(passport);

authenticationRoute.post('/signup', upload.single('certificate'), SignUpValidationRule, SignUpValidationCheck, async (req, res, next) => {

    return UserService.userSignUp(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.phoneNumber, req.body.userType, req.file?.filename, function(error, success, statusCode) {
        if(error) {
            return res.status(statusCode).json(new JSONResponse().getJson(error));
        }
        return res.status(statusCode).json(new JSONResponse(null, success).getJson());
    });
});

authenticationRoute.post('/verify/:userId', async (req, res, next) => {
    const userId = req.params.userId;

    // Find the user with the given userId and update is_verified to true
    User.findByIdAndUpdate(
        userId, 
        { is_verified: true }, 
        { new: true },  // This option returns the updated document
        (err, user) => {
            if (err) {
                // Handle the error...
                return res.status(500).json(new JSONResponse('An error occurred while verifying the user.').getJson());
            }

            if (!user) {
                // If no user was found with the given userId...
                return res.status(404).json(new JSONResponse('No user found with the given userId.').getJson());
            }

            // If the user was successfully verified...
            return res.status(200).json(new JSONResponse(null, 'User successfully verified.').getJson());
        }
    );
});



authenticationRoute.post('/signin', SignInValidationRule, SignInValidationCheck, passport.authenticate('local', {session: false}), async (req, res, next) => {
    res.json({
        message: Constants.SuccessMessages.SigninSuccessfull,
        user: req.user
    });
})


module.exports = authenticationRoute;