// server.js
const { Room } = require("@colyseus/core");
const { Schema, ArraySchema, type } = require("@colyseus/schema");
const { Server } = require("@colyseus/core");
const { WebSocketTransport } = require("@colyseus/ws-transport");
const express = require("express");
const http = require("http");
const path = require("path");

class TicTacToeState extends Schema {
  constructor() {
    super();
    this.board = new ArraySchema("", "", "", "", "", "", "", "", "");
    this.currentTurn = "X";
    this.winner = null;
    this.players = new ArraySchema();
  }
}

// Define the schema types
type(["string"])(TicTacToeState.prototype, "board");
type("string")(TicTacToeState.prototype, "currentTurn");
type("string")(TicTacToeState.prototype, "winner");
type(["string"])(TicTacToeState.prototype, "players");

class TicTacToeRoom extends Room {
  onCreate() {
    this.setState(new TicTacToeState());
    this.maxClients = 2;

    this.onMessage("move", (client, data) => {
      const player = client.sessionId === this.state.players[0] ? "X" : "O";

      if (
        this.state.currentTurn === player &&
        this.state.board[data.position] === "" &&
        !this.state.winner
      ) {
        this.state.board[data.position] = player;
        this.state.currentTurn = player === "X" ? "O" : "X";
        this.checkWinner();
      }
    });
  }

  onJoin(client) {
    this.state.players.push(client.sessionId);
  }

  checkWinner() {
    const winningCombos = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // columns
      [0, 4, 8],
      [2, 4, 6], // diagonals
    ];

    for (let combo of winningCombos) {
      const [a, b, c] = combo;
      if (
        this.state.board[a] &&
        this.state.board[a] === this.state.board[b] &&
        this.state.board[a] === this.state.board[c]
      ) {
        this.state.winner = this.state.board[a];
        return;
      }
    }

    // Check for draw
    let isDraw = true;
    for (let i = 0; i < 9; i++) {
      if (this.state.board[i] === "") {
        isDraw = false;
        break;
      }
    }
    if (isDraw) {
      this.state.winner = "draw";
    }
  }
}

const app = express();
const port = 2567;

// Serve static files from the current directory
app.use(express.static("."));

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server: server,
  }),
});

// Register your room
gameServer.define("tictactoe", TicTacToeRoom);

// Listen on port
server.listen(port, () => {
  console.log(`🎮 Game server running on http://localhost:${port}`);
});
