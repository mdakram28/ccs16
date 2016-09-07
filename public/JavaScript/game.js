var submitButton = ("#attemptForm #submit");
var attemptInput = ('#attemptForm textarea');
var quesArea = ("#content #ques");
var answerForm = "#answerForm";

var http;
var scope;
var httpParamSerializerJQLike;



function endTest(){
    if(confirm("Are you sure you want to end the test? You wont be able to come back to this test again.")){
        location.replace("/endTest/"+category.toLowerCase());
    }
}

function refreshQuestions(){
  var req = http.get("/api/allQuestions/"+category.toLowerCase());
  req.success(function(data){
      scope.ques = data;
      scope.changeQuestion(0);
      refreshSolvedCount();
  });
  req.error(function(data){
    toastr.error("Unable to connect to server. Please refresh the page");
  });
}

function refreshSolvedCount(){
    scope.solved = 0;
    scope.ques.forEach(function(ques){
        if(ques.attempt!="" && ques.attempt){
            scope.solved++;
        }
    })
}

function submitAnswer(){
    if(scope.ques[scope.qno].attempt == "" || !scope.ques[scope.qno].attempt){
        return toastr.error("Cannot submit empty answer.")
    }
  var req = http({
    method  : 'POST',
    url     : "/api/attempt",
    data    : httpParamSerializerJQLike({ans:$(attemptInput).val(),qid:scope.ques[scope.qno]._id.toString()}), //forms user object
    headers : {'Content-Type': 'application/x-www-form-urlencoded'}
  });
  req.success(function(data){
      toastr.info("Answer submitted successfully");
      scope.ques[scope.qno].attempt = $(attemptInput).val();
      if(scope.qno<scope.ques.length-1){
          scope.changeQuestion(scope.qno+1);
      }else{
          scope.changeQuestion(0);
      }
      refreshSolvedCount();
      $apply();
  });
  req.error(function(data){
    toastr.error("Request failed");
  });
}

var app = angular.module('riddlerApp',["ngSanitize"]);
app.filter("trust", ['$sce', function($sce) {
  return function(htmlCode){
    return $sce.trustAsHtml(htmlCode);
  }
}]);
app.controller('riddlerController',function($scope,$http,$httpParamSerializerJQLike){
  http = $http;
  scope = $scope;
  httpParamSerializerJQLike = $httpParamSerializerJQLike;
  scope.ques = [];
  scope.category = category;
  scope.solved = 0;
  $(submitButton).click(submitAnswer);
  $(answerForm).submit(submitAnswer);
    refreshQuestions();
    scope.changeQuestion = function(qno){
        scope.qno = qno;
    }
    scope.selectOption = function(i){
        console.log(i);
        if(scope.ques[scope.qno].attempt == scope.ques[scope.qno].choices[i]){
            scope.ques[scope.qno].attempt = undefined;
        }else{
            scope.ques[scope.qno].attempt = scope.ques[scope.qno].choices[i];
        }
    }
});

$apply = function() {
  try {
    scope.$apply();
    scope.$digest();
    }catch(e){}
}
