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

require('../Authentication/auth')(passport);

authenticationRoute.post('/signup', upload.single('certificate'), SignUpValidationRule, SignUpValidationCheck, async (req, res, next) => {

    return UserService.userSignUp(req.body.email, req.body.password, req.body.firstName, req.body.lastName, req.body.phoneNumber, req.body.userType, req.file.filename, function(error, success, statusCode) {
        if(error) {
            return res.status(statusCode).json(new JSONResponse().getJson(error));
        }
        return res.status(statusCode).json(new JSONResponse(null, success).getJson());
    });
});

authenticationRoute.post('/signin', SignInValidationRule, SignInValidationCheck, passport.authenticate('local', {session: false}), async (req, res, next) => {
    res.json({
        message: Constants.SuccessMessages.SigninSuccessfull,
        user: req.user
    });
})

module.exports = authenticationRoute;