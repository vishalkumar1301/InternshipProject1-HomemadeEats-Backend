// 3rd party modules
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

// custom modules
const User = require('../Models/user');
const { Constants } = require('../constants');

module.exports = async function (passport) {
    passport.use(new localStrategy({usernameField: 'email'}, function (username, password, done) {
        User.findOne({email: username}, function (err, user) {
            if(err) return done(err);
            if(!user) return done(null, false);
            
            user.IsValidPassword(password, (err, isMatch)=>{
                if(err) return done(err);
                if(!isMatch) {
                    return done(null, false)
                }
                if(user.token) {
                    return done(null, {token: user.token});
                }
                user.generateToken((err, user) => {
                    if(err) return done(err);
                    return done(null, {token: user.token});
                });
            });
        });
    }));
}