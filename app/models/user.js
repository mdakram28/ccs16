// load the things we need
var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    profile : {
      regNo : String,
      username : String,
      mobNo : String,
      fullName : String
    },
    authType : String,
    detailsFilled : { type: Boolean, default: false },
    local            : {
        email        : String,
        password     : String,
        vrfToken     : String,
        verified     : Boolean,
    },
    facebook         : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    google           : {
        id           : String,
        token        : String,
        email        : String,
        name         : String
    },
    status:{
      currentQues:{type:Number,default:1},
      attempts:{type:Number,default:0},
      credits:{type:Number,default:0},
      hints:[Number],
      rank:{type:Number,default:0},
      lastSolveTime:Date
    },
    logs:{
      attempsLog:[{
        quesNum : Number,
        attemps:[String]
      }]
    }

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
