// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var quesSchema = mongoose.Schema({
  qno : Number,
  ques:String,
  choices:{type: Array, default: []},
  answer:String,
  category: {type: String , enum: ["logical","webdev","security","design"]},
  attempt : String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Ques', quesSchema);
