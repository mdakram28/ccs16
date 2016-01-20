// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var quesSchema = mongoose.Schema({
  quesNum : Number,
  ques:String,
  hint:String,
  story:String,
  closeAnswers:[String],
  answer:String
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Ques', quesSchema);