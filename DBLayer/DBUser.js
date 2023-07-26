const mongoose = require('mongoose');

const User = require('../Models/user');

class DBUser {
    async GetFcmTokenArrayForUsers(userIds) {
        let arrayOfObjectIds = this.getArrayOfObjectIds(userIds);
        let users = await User.find({
            '_id': {
                $in: arrayOfObjectIds,
            }
        });
        return users.map(function (user) {
            return user.fcmToken;
        })
    }

    getArrayOfObjectIds(userIds) {
        return userIds.map(function(userId) {
            return mongoose.Types.ObjectId(userId)
        });
    }

    async UpdateUserDetailsByUserId(userId, email, firstName, lastName, phoneNumber) {
        try {
            await User.findOneAndUpdate({_id: userId}, {email: email, firstName: firstName, lastName: lastName, phoneNumber: phoneNumber});
        }
        catch (err) {
            throw err;
        }
    }
}

module.exports = new DBUser();