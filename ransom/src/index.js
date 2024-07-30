const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

// Define a map to store the todo items
var todoItems = {};

// Function to handle advance requests
async function handle_advance(data) {
  console.log("Received advance request data " + JSON.stringify(data));
  return "accept";
}

// Function to handle inspect requests
async function handle_inspect(data) {
  console.log("Received inspect request data " + JSON.stringify(data));
  return "accept";
}

// Function to handle add todo item requests
async function handle_add_todo(data) {
  console.log("Received add todo item request data " + JSON.stringify(data));
  const id = data.id;
  const text = data.text;

  // Check if the todo item already exists
  if (todoItems[id]) {
    console.log("Todo item already exists");
    return "reject";
  }

  // Add the todo item to the list
  todoItems[id] = { text, completed: false };

  return "accept";
}

// Function to handle get todo items requests
async function handle_get_todos(data) {
  console.log("Received get todo items request data " + JSON.stringify(data));
  const todos = [];

  // Return all todo items
  for (const id in todoItems) {
    todos.push({ id, text: todoItems[id].text, completed: todoItems[id].completed });
  }

  return { todos };
}

// Function to handle update todo item requests
async function handle_update_todo(data) {
  console.log("Received update todo item request data " + JSON.stringify(data));
  const id = data.id;
  const text = data.text;
  const completed = data.completed;

  // Check if the todo item exists
  if (!todoItems[id]) {
    console.log("Todo item does not exist");
    return "reject";
  }

  // Update the todo item
  todoItems[id] = { text, completed };

  return "accept";
}

// Function to handle delete todo item requests
async function handle_delete_todo(data) {
  console.log("Received delete todo item request data " + JSON.stringify(data));
  const id = data.id;

  // Check if the todo item exists
  if (!todoItems[id]) {
    console.log("Todo item does not exist");
    return "reject";
  }

  // Delete the todo item
  delete todoItems[id];

  return "accept";
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
  add_todo: handle_add_todo,
  get_todos: handle_get_todos,
  update_todo: handle_update_todo,
  delete_todo: handle_delete_todo,
};

var finish = { status: "accept" };

(async () => {
  while (true) {
    const finish_req = await fetch(rollup_server + "/finish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "accept" }),
    });

    console.log("Received finish status " + finish_req.status);

    if (finish_req.status == 202) {
      console.log("No pending rollup request, trying again");
    } else {
      const rollup_req = await finish_req.json();
      var handler = handlers[rollup_req["request_type"]];
      finish["status"] = await handler(rollup_req["data"]);
    }
  }
})();