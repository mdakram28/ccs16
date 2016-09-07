// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    details : {
        regNo : String,
        mobNo : String,
        fullName : String,
        experience : String,
        projects : String
    },
    detailsFilled : { type: Boolean, default: false },
    completed : {type: Boolean, default : false},
    giving : String,
    submitted : {type : Array, default : []},
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    attempts: {}
});

// generating a hash
userSchema.methods.generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
userSchema.methods.validPassword = function(password) {
    return bcrypt.compareSync(password, this.local.password);
};

// create the model for users and expose it to our app
module.exports = mongoose.model('User', userSchema);
