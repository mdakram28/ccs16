var submitButton = ("#attemptForm button");
var attemptInput = ('#attemptForm input[type="text"]');
var storyArea = ("#content #story");
var quesArea = ("#content #ques");

var http;
var scope;
var httpParamSerializerJQLike;

function refreshQuestion(){
  var req = http.get("/api/currentQuestion");
  req.success(function(data){
    $(storyArea).html(data.story);
    $(quesArea).html(data.ques);
  });
  req.error(function(data){
    console.log(data);
  });
}

function submitAnswer(){
  var req = http({
    method  : 'POST',
    url     : "/api/attempt",
    data    : httpParamSerializerJQLike({ans:$(attemptInput).val()}), //forms user object
    headers : {'Content-Type': 'application/x-www-form-urlencoded'}
  });
  req.success(function(data){
    if(!data.success){
      if(data.alert){
        alert(data.message);
      }else{
        console.log(data.message);
      }
    }else{
      alert("Congratulations ... right answer")
    }
  });
  req.error(function(data){
    console.log(data);
  });
}

var app = angular.module('riddlerApp',[]);
app.controller('riddlerController',function($scope,$http,$httpParamSerializerJQLike){
  http = $http;
  scope = $scope;
  httpParamSerializerJQLike = $httpParamSerializerJQLike;
  refreshQuestion();
  $(submitButton).click(submitAnswer);
  //$(attemptInput).keyup("enter",submitAnswer);
});
