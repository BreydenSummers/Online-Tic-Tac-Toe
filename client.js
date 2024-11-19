document.addEventListener("DOMContentLoaded", () => {
  joinGame();
});

const gameBoard = document.querySelector(".game-board");
const status = document.querySelector(".status");
let client;
let room;

async function joinGame() {
  try {
    // Get the server URL from window location or environment
    const protocol = window.location.protocol.replace("http", "ws");
    const serverUrl = `${protocol}//${window.location.hostname}${window.location.port ? ":" + window.location.port : ""}`;

    client = new Colyseus.Client(serverUrl);
    room = await client.joinOrCreate("tictactoe");

    room.state.onChange(() => {
      updateBoard();
      updateStatus();
    });

    // Set up the game board
    gameBoard.innerHTML = "";
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.addEventListener("click", () => makeMove(i));
      gameBoard.appendChild(cell);
    }
  } catch (error) {
    console.error("Failed to join game:", error);
    status.textContent = "Failed to join game. Check console for details.";
  }
}

function makeMove(position) {
  if (room) {
    room.send("move", { position });
  }
}

function updateBoard() {
  const cells = document.querySelectorAll(".cell");
  cells.forEach((cell, index) => {
    cell.textContent = room.state.board[index];
  });
}

function updateStatus() {
  if (room.state.winner) {
    if (room.state.winner === "draw") {
      status.textContent = "Game ended in a draw!";
    } else {
      status.textContent = `Player ${room.state.winner} wins!`;
    }
  } else {
    status.textContent = `Current turn: ${room.state.currentTurn}`;
  }
}
