var socket;
var topic;
var port = 443;
var inChat = false;
var textbox = document.getElementById("textbox");
var msgBox = document.getElementById("msgBox");
var typingIndicator = document.getElementById("typingIndicator");
var foundSound = new Audio("/sounds/found.ogg");
var messageSound = new Audio("/sounds/message.wav");

supportsWebSockets = 'WebSocket' in window || 'MozWebSocket' in window;
if (!supportsWebSockets) {
    alert("This browser doesn't support WebSockets. Site won't work as intended.");
}

document.getElementById("topic").focus();

document.getElementById("topic").addEventListener('keypress', function (e) {
    if (e.keyCode == 13) {
        FindMatch();
    }
});

msgBox.addEventListener('keypress', function (e) {
    if (e.keyCode == 13) {
        SendMsg();
        socket.emit("typing", "NO");
    }
});

function FindMatch() {
    document.getElementById("findButton").disabled = true;
    document.getElementById("topic").disabled = true;
    topic = document.getElementById("topic").value;
    if (topic === "") {
        document.getElementById("findButton").disabled = false;
        document.getElementById("topic").disabled = false;
        return;
    }
    document.getElementById("spinner").style = "visibility:visible";
    document.getElementById("findButton").innerHTML = "Looking for someone";
    document.getElementById("findButton").style = "font-size:20px";
    //Connect to the server
    socket = io.connect(location.host + ":" + port, { secure: true });
    msgBox.oninput = function () {
        if (!inChat) {
            return;
        }
        if (msgBox.value === "") {
            socket.emit("typing", "NO");
        } else {
            socket.emit("typing", "YES");
        }
    }
    socket.on("msg", function (msg) {
        if (!inChat) {
            return;
        }
        if (document.hidden) {
            messageSound.play();
        }
        var newMsg = document.createElement("div");
        newMsg.className = "partnerMessage";
        newMsg.innerHTML = msg;
        textbox.appendChild(newMsg);
        updateScroll();
    })
    socket.on("partnerLeft", function (msg) {
        socket.emit("partnerLeftOK", "");
        var newMsg = document.createElement("div");
        newMsg.className = "serverMessage";
        newMsg.innerHTML = msg;
        textbox.appendChild(newMsg);
        updateScroll();
    })
    socket.on("found", function (msg) {
        inChat = true;
        foundSound.play();
        document.getElementById("intro").style = "display:none";
        document.getElementById("main").style = "display:table; margin-top:16px";
        document.getElementById("commonTopic").innerHTML = "Topic: " + topic;
        msgBox.focus();
    })
    socket.on("typing", function (msg) {
        if (!inChat) {
            return;
        }
        if (msg.toString() === "YES") {
            typingIndicator.style = "visibility:visible";
        }
        if (msg.toString() === "NO") {
            typingIndicator.style = "visibility:hidden";
        }
    })
    socket.emit("topic", topic);
}

function SendMsg() {
    var msg = msgBox.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    msgBox.value = "";
    var newMsg = document.createElement("div");
    newMsg.className = "myMessage";
    newMsg.innerHTML = msg;
    textbox.appendChild(newMsg);
    if (!inChat) {
        return;
    }
    socket.emit("msg", msg);
    updateScroll();
}

function updateScroll() {
    textbox.scrollTop = textbox.scrollHeight;
}

function LeaveChat(url) {
    if (inChat === true) {
        if (confirm("Are you sure you want to leave the chat?")) {
            document.location = url;
        }
    } else {
        document.location = url;
    }
}
