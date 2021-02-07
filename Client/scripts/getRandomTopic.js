var topicSocket;
var port = 443;

topicSocket = io.connect(location.host + ":" + port, { secure: true });
topicSocket.on("randomTopic", function (topic) {
  if(topic !== "") {
    document.getElementById("randomTopic").innerHTML = "Someone wants to talk about \"" + topic + "\"";
  }
  topicSocket.close();
})

topicSocket.emit("randomTopic", "");