var submitButton = ("#attemptForm #submit");
var attemptInput = ('#attemptForm input[type="text"]');
var storyArea = ("#story");
var quesArea = ("#content #ques");
var addFriendForm = "#addFriendForm";
var answerForm = "#answerForm";
var hintButton = "#getHintButton";
var inviteInput = "#inviteInput";
var inviteForm = "#inviteForm";

var http;
var scope;
var httpParamSerializerJQLike;

function addFriend(username,index){
  var req = http({
    method  : 'POST',
    url     : "/api/addFriend",
    data    : httpParamSerializerJQLike({username:username}), //forms user object
    headers : {'Content-Type': 'application/x-www-form-urlencoded'}
  });
  req.success(function(data){
    if(!data.success){
      if(data.alert){
        alert(data.message);
      }else{
        toastr.error(data.message);
      }
    }else{
      toastr.success("Friend added. See him in friends tab.");
      scope.friends.push(data.friend);
      scope.searchResults.splice(index,1);
      $apply();
    }
  });
  req.error(function(data){
    console.log(data);
    toastr.error("Some error occurred . Unable to add friend");
  });
}

function invite(){
  var email = $(inviteInput).val();
  var req = http.get("/api/invite?email="+encodeURIComponent(email));
  req.success(function(data){
    if(!data.success){
      if(data.alert){
        alert(data.message);
      }else{
        toastr.warning(data.message);
      }
    }else{
      toastr.success(data.message);
    }
  });
  req.error(function(data){
    toastr.error("Error.")
  });
}

function removeFriend(username,index){
  var req = http.get("/api/removeFriend?username="+encodeURIComponent(username));
  req.success(function(data){
    if(!data.success){
      if(data.alert){
        alert(data.message);
      }else{
        taostr.error(data.message);
      }
    }else{
      toastr.success(data.message);
      scope.friends.splice(index,1);
      $apply();
    }
  });
  req.error(function(data){
    toastr.error("Unable to connect to server.")
  });
}

function searchFriends(search){
  var req = http.get("/api/searchFriends?search="+encodeURIComponent(search));
  req.success(function(data){
    scope.searchResults = data;
  });
  req.error(function(data){
    toastr.error("Error.")
  });
}

function refreshQuestion(){
  var req = http.get("/api/currentQuestion");
  req.success(function(data){
    if(data.end==true){
      return alert(data.alert);
    }
    $(quesArea).html(data.ques);
    $(storyArea).html(data.story);
    scope.currentQues = data.currentQues;
    scope.ques = data;
    $('#storyModal').modal('show');
  });
  req.error(function(data){
    toastr.error("Unable to connect to server.")
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
        toastr.info(data.message);
      }
    }else{
      refreshQuestion();
      toastr.success("Congratulations you just cleared level - "+(data.currentQues-1));
      scope.rank = data.rank;
      scope.credits = data.credits;
    }
  });
  req.error(function(data){
    console.log(data);
  });
}

function getHint(){
  var req = http.get("/api/getHint");
  req.success(function(data){
    if(!data.success){
      if(data.alert){
        alert(data.message);
      }else{
        toastr.info(data.message);
      }
    }else{
      toastr.success(data.message);
      scope.hint = data.hint;
      if(data.credits!=undefined){
        scope.credits = data.credits;
      }
      scope.ques.hintBought = true;
      $('#hintModal').modal('show');
      $apply();
    }
  });
  req.error(function(data){
    toastr.error("Error.")
  });
}

var app = angular.module('riddlerApp',[]);
app.controller('riddlerController',function($scope,$http,$httpParamSerializerJQLike){
  http = $http;
  scope = $scope;
  httpParamSerializerJQLike = $httpParamSerializerJQLike;
  refreshQuestion();
  $(submitButton).click(submitAnswer);
  $(answerForm).submit(submitAnswer);
  $(hintButton).click(getHint);
  $(inviteForm).submit(invite);
  
  // document.getElementById("submit").addEventListener("keydown", function (e) {
  //     if (e.keyCode === 13) {
  //       submitAnswer();
  //     }
  // });
  //$(attemptInput).keyup("enter",submitAnswer);
  
  $(addFriendForm).submit(function(){
    searchFriends($(addFriendForm+' input[type="text"]').val());
  });
  
  $scope.currentQues = currentQues;
  $scope.rank = rank;
  $scope.credits = credits;
  $scope.addFriend = addFriend;
  $scope.removeFriend = removeFriend;
  $scope.searchResults = [];
  $scope.friends = friends;
});

var socket = io('https://riddler-mdakram28.c9users.io');

// Send the ready event.
socket.emit('ready',socketToken);

socket.on("notify",function(data){
  toastr.info(data);
});

socket.on("updateFriendRank",function(data) {
  var friend;
  console.log(data);
  if(data.username==username){
    scope.rank = data.rank;
    return;
  }
  scope.friends.forEach(function(fr){
    if(friend!=undefined)return;
    if(fr.username==data.username)friend = fr;
    console.log(fr.username);
  });
  if(!friend)return;
  friend.rank = data.rank;
  toastr.info("<strong>"+friend.fullName+"</strong> is now at rank "+data.rank);
  $apply();
});

socket.on("updateRank",function(data) {
    scope.rank = data;
    toastr.warning("You are now at rank "+data);
    $apply();
});

$apply = function() {
  try {
    scope.$apply();
  } finally {
    $digest();
  }
}

socket.on("news",function(data) {
    console.log(data);
})