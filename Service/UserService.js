const User = require('../Models/user');
const { logger } = require('../Config/winston');
const { Constants } = require('../constants');
const DBUser = require('../DBLayer/DBUser');

class UserService {

    userSignIn(email, password, done) {
        User.findOne({ email: email }, function (err, user) {
            if (err) {
                logger.error(err);
                return done(err);
            }
            if (!user) return done(null, false);
            if(user.userType === 1 && !user.is_verified) {
                return done(null, false);
            }

            user.IsValidPassword(password, (err, isMatch) => {
                if (err) {
                    logger.error(err);
                    return done(err);
                }
                if (!isMatch) {
                    return done(null, false)
                }
                if (user.token) {
                    return done(null, {
                        token: user.token,
                        userType: user.userType,
                    });
                }
                user.generateToken((err, user) => {
                    if (err) {
                        logger.error(err);
                        return done(err);
                    }
                    return done(null, {
                        token: user.token,
                        userType: user.userType,
                    });
                });
            });
        });
    }

    userSignUp(email, password, firstName, lastName, phoneNumber, userType, certificate_image, callback) {
        User.findOne({ email: email }, function (err, user) {
            if (err) {
                logger.error(err);
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            }
            if (user) {
                callback(null, Constants.ErrorMessages.EmailAlreadyExists, 409)
            }
            else {
                var newUser = new User();
                newUser.email = email;
                newUser.password = password;
                newUser.firstName = firstName;
                newUser.lastName = lastName;
                newUser.phoneNumber = phoneNumber;
                newUser.userType = userType;
                newUser.certificate_image = certificate_image;
                newUser.save(function (err) {
                    if (err) {
                        logger.error(err);
                        return callback(Constants.ErrorMessages.InternalServerError, null, 500);
                    }
                    callback(null, Constants.SuccessMessages.SignupSuccessfull, 200)
                });
            }
        });
    }


    updateFCMToken(token, fcmToken, callback) {
        User.findOneAndUpdate({ token: token }, { fcmToken: fcmToken }, function (err, user) {
            if (err) {
                callback(Constants.ErrorMessages.InternalServerError, null, 500);
            }
            callback(null, Constants.SuccessMessages.FcmTokenUpdated, 200);
        })
    }

    async UpdateUserDetails(userId, email, firstName, lastName, phoneNumber) {
        try {
            await DBUser.UpdateUserDetailsByUserId(userId, email, firstName, lastName, phoneNumber);
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = new UserService();