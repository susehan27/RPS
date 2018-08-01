
//initialize firebase
var config = {
    apiKey: "AIzaSyCckMBa8TfHJC9ylwEZvFQik_KOhKAr0Pw",
    authDomain: "rps-multiplayer-e1667.firebaseapp.com",
    databaseURL: "https://rps-multiplayer-e1667.firebaseio.com",
    projectId: "rps-multiplayer-e1667",
    storageBucket: "rps-multiplayer-e1667.appspot.com",
    messagingSenderId: "122784379327"
};

firebase.initializeApp(config);

var database = firebase.database();

//variables to store data for each player object
//will be null until each player is assigned and game starts
var player1 = null;
var player2 = null;

//variables to store each player name
var player1name = "";
var player2name = "";

//variable to store user's name to browser
var yourName = "";

//variable to store player's choices (r/p/s)
var player1choice = "";
var player2choice = "";

//for keeping track of the turn
var turn = 1;

//firebase database

//attach a listener to the database /players/ to listen for any changes
database.ref("/players/").on("value", function(snapshot){
    //checking to see player1 existence
    if (snapshot.child("player1").exists()) {
        console.log("player 1 exists");

        //records player1 data
        player1 = snapshot.val().player1;
        player1name = player1.name;

        //updates player1 display
        $("#p1name").text(player1name);
        $("#p1stats").html(`Win: ${player1.win} | Loss: ${player1.loss} | Tie: ${player1.tie}`);

    }
    else {
        console.log("player1 does not exist");

        //make sure that player1 data is empty
        player1 = null;
        player1name = "";

        //updates player1 display
        $("#p1name").text("Waiting for Player 1...");
        $("#player1").removeClass("playerTurn");
        $("#player2").removeClass("playerTurn");
        database.ref("/outcome/").remove();
        $("#outcome").html("RPS");
        $("#waiting").html("");
        $("#p1stats").html(`Win:0\nLoss:0\nTie:0`);
    }

    //checking to see player2 existence
    if (snapshot.child("player2").exists()) {
        console.log("player 2 exists");

        //records player2 data
        player2 = snapshot.val().player2;
        player2name = player2.name;

        //updates player2 display
        $("#p2name").text(player2name);
        $("#p2stats").html(`Win: ${player2.win} | Loss: ${player2.loss} | Tie: \n${player2.tie}`);

    }
    else {
        console.log("player2 does not exist");

        //make sure that player2 data is empty
        player2 = null;
        player2name = "";

        //updates player2 display
        $("#p2name").text("Waiting for Player 2...");
        $("#player1").removeClass("playerTurn");
        $("#player2").removeClass("playerTurn");
        database.ref("/outcome/").remove();
        $("#outcome").html("RPS");
        $("#waiting").html("");
        $("#p2stats").html(`Win:0\nLoss:0\nTie:0`);
    }

    //checks if both player1 & player2 exists, proceeds to player1's turn
    if (player1 && player2) {
        //updates player 1 display with green border
        $("#player1").addClass("playerTurn");
        
        //updates display for turn waiting
        $("#waiting").html(`Waiting on ${player1name} to choose`);
    }
    
    //empties chat session if both players leave the game
    if(!player1 && !player2) {
        database.ref("/chat/").remove();
        database.ref("/turn/").remove();
        database.ref("/outcome/").remove();

        $("#chat").empty();
        $("#player1").removeClass("playerTurn");
        $("#player2").removeClass("playerTurn");
        $("#outcome").html("RPS");
        $("#waiting").html("");
    }

});

//attach a listener for any disconnections
database.ref("/players/").on("child_removed", function(snapshot) {
    var dc = `${snapshot.val().name} has disconnected!`;

    //get key for disconnection chat entry
    var chatKey = database.ref().child("/chat/").push().key;

    //save disconnection chat entry
    database.ref("/chat/" + chatKey).set(dc);
});

//attach listener to database /chat/ for any new chat messages
database.ref("/chat/").on("child_added", function(snapshot){
    var chatMessage = snapshot.val();
    var chatInput = $("<div>").html(chatMessage);

    //change color of chat depending on player/connection
    if (chatMessage.includes("disconnected")) {
        chatInput.addClass("chatDisconnect");
    }
    else if (chatMessage.includes("joined")) {
        chatInput.addClass("chatJoin");
    }
    else if (chatMessage.startsWith(yourName)) {
        chatInput.addClass("chatP1");
    }
    else {
        chatInput.addClass("chatP2");
    }

    $("#chat").append(chatInput);
    $("#chat").scrollTop($("#chat")[0].scrollHeight);
});

//attach a listener to database /turn/ for any changes in turn
database.ref("/turn/").on("value", function(snapshot) {
    //check if it's player1's turn
    if (snapshot.val() === 1) {
        console.log("Turn 1");
        turn = 1;

        //update display if both two players are in the game

        if (player1 && player2) {
            $("#player1").addClass("playerTurn");
            $("#player2").removeClass("playerTurn");
            $("#waiting").html(`Waiting on ${player1name} to choose...`);
        }
    }
    else if (snapshot.val() === 2) {
        console.log("Turn 2");
        turn = 2;

        //update display if both two players are in the game
        if (player1 && player2) {
            $("#player1").removeClass("playerTurn");
            $("#player2").addClass("playerTurn");
            $("#waiting").html(`Waiting on ${player2name} to choose...`);
        }
    }
});

//attach a listener to database /outcome/ for game result updates
database.ref("/outcome/").on("value", function(snapshot) {
    $("#outcome").html(snapshot.val());
});

//click events

//attach event handler to submit button to add new player
$("#nameSubmit").on("click", function(event) {
    event.preventDefault();

    //checks if user name input form is not empty & that player1&2 do not exist
    if ( ($("#userName").val().trim() !== "") && !(player1 && player2)) {
        //add player1
        if (player1 === null) {
            console.log("adding player 1...");

            yourName = $("#userName").val().trim();
            player1 = {
                name: yourName,
                win: 0,
                loss: 0,
                tie: 0,
                choice: ""
            };

            //add player1 object to database
            database.ref().child("/players/player1").set(player1);

            //set turn to 1 so player1 goes first
            database.ref().child("/turn/").set(1);

            //if user disconnects, remove user from database
            database.ref("/players/player1").onDisconnect().remove();
        }
        else if ( (player1 !== null) && (player2 === null)) {
            //add player2
            console.log("adding player 2...");

            yourName = $("#userName").val().trim();
            player2 = {
                name: yourName,
                win: 0,
                loss: 0,
                tie: 0,
                choice: ""
            };

            //add player 2 object to database
            database.ref().child("/players/player2").set(player2);

            //if user disconnects, remove user from database
            database.ref("/players/player2").onDisconnect().remove();
        }

        //message chat for new player joining
        var message = `\n${yourName} has joined!`;
        console.log(message);

        //get key for join chat entry
        var chatKey = database.ref().child("/chat/").push().key;

        //save join chat entry
        database.ref("/chat/" + chatKey).set(message);

        //reset user name input box
        $("#userName").val("");
    }
});

//attach event handler for the chat send button for new messages
$("#chatSend").on("click", function(event) {
    event.preventDefault();

    //makes sure player exists and chat iput is not empty
    if ( (yourName !=="") && ($("#chatInput").val().trim() !== "")) {
        var message = `\n${yourName}: ${$("#chatInput").val().trim()}\n`;
        $("#chatInput").val("");

        //get key for new chat entry
        var chatKey = database.ref().child("/chat/").push().key;

        //save new chat entry
        database.ref("/chat/" + chatKey).set(message);
    }
});

//player 1's RPS selection
$("#player1").on("click", ".option", function(event) {
    event.preventDefault();

    //make selections only when both players are in the game
    if (player1 && player2 && (yourName === player1.name) && (turn === 1)) {
        //record player1's choice
        var choice = $(this).text().trim();

        //record choice into databse
        player1choice = choice;
        database.ref().child("/players/player1/choice").set(choice);

        //set turn to player 2's turn
        turn = 2;
        database.ref().child("/turn/").set(2);

    }
});

//player 2's RPS selection
$("#player2").on("click", ".option", function(event) {
    event.preventDefault();

    if (player1 && player2 && (yourName === player2.name) && (turn === 2)) {
        //record player 2's choice
        var choice = $(this).text().trim();

        //record player choice into database
        player2choice = choice;
        database.ref().child("/players/player2/choice").set(choice);

        //compare player1 & player2 choices and record outcome
        rpsGo();
    }
});

//function for comparing two player's RPS selection and displaying/updating outcome of selection
function rpsGo() {
    if ((player1.choice === "Rock" && player2.choice === "Rock") || (player1.choice === "Scissors" && player2.choice === "Scissors") || (player1.choice === "Paper" && player2.choice === "Paper")) {
        console.log("Tie!");
        database.ref().child("/outcome/").set("It's a tie!!");
        database.ref().child("/players/player1/tie").set(player1.tie + 1);
        database.ref().child("/players/player2/tie").set(player2.tie + 1);
    }
    else if (player1.choice === "Rock" && player2.choice === "Paper") {
        console.log("Paper wins!")
        database.ref().child("/outcome/").set("Rock vs Paper: Paper wins!");
        database.ref().child("/players/player1/loss").set(player1.loss + 1);
        database.ref().child("/players/player2/win").set(player2.win + 1);
    }
    else if (player1.choice === "Paper" && player2.choice === "Rock") {
        console.log("Paper wins!")
        database.ref().child("/outcome/").set("Paper vs Rock: Paper wins!");
        database.ref().child("/players/player1/win").set(player1.win + 1);
        database.ref().child("/players/player2/loss").set(player2.loss + 1);
    }
    else if (player1.choice === "Rock" && player2.choice === "Scissors") {
        console.log("Rock wins!")
        database.ref().child("/outcome/").set("Rock vs Scissors: Rock wins!");
        database.ref().child("/players/player1/win").set(player1.win + 1);
        database.ref().child("/players/player2/loss").set(player2.loss + 1);
    }
    else if (player1.choice === "Scissors" && player2.choice === "Rock") {
        console.log("Rock wins!")
        database.ref().child("/outcome/").set("Scissors vs Rock: Rock wins!");
        database.ref().child("/players/player1/loss").set(player1.loss + 1);
        database.ref().child("/players/player2/win").set(player2.win + 1);
    }
    else if (player1.choice === "Scissors" && player2.choice === "Paper") {
        console.log("Scissors wins!")
        database.ref().child("/outcome/").set("Scissors vs Paper: Scissors wins!");
        database.ref().child("/players/player1/win").set(player1.win + 1);
        database.ref().child("/players/player2/loss").set(player2.loss + 1);
    }
    else if (player1.choice === "Paper" && player2.choice === "Scissors") {
        console.log("Scissors wins!")
        database.ref().child("/outcome/").set("Scissors vs Paper: Scissors wins!");
        database.ref().child("/players/player1/loss").set(player1.loss + 1);
        database.ref().child("/players/player2/win").set(player2.win + 1);
    }

    //sets turn back to player1
    turn = 1;
    database.ref().child("/turn").set(1);
};





