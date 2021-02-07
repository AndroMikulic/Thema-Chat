var socket;
var port = 443;
var statsJSON;

socket = io.connect(location.host + ":" + port, { secure: true });
socket.on("stats", function (stats) {
  console.log(stats.toString())
  statsJSON = JSON.parse(stats);
  document.getElementById("usersWaiting").innerHTML = "People waiting for a match: " + statsJSON["usersWaiting"]
  document.getElementById("lastTopic").innerHTML = "Last topic entered: " + statsJSON["lastTopic"]
})

socket.emit("stats", "");