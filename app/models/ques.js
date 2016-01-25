// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var quesSchema = mongoose.Schema({
  quesNum : Number,
  ques:String,
  hint:String,
  story:String,
  closeAnswers:[String],
  answer:String,
  credits:{type:Number,default:1000},
  solvedCount:{type:Number,default:0},
  attemptCount:{type:Number,default:0},
  hintCost : {type:Number,default:0}
});

// create the model for users and expose it to our app
module.exports = mongoose.model('Ques', quesSchema);
