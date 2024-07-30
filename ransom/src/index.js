import { ROLLUP_SERVER } from './shared/config';
import { hexToString } from 'viem';
import { RollupStateHandler } from './shared/rollup-state-handler';
import { controller } from './controller';

const { ethers } = require("ethers");

const rollup_server = process.env.ROLLUP_HTTP_SERVER_URL;
console.log("HTTP rollup_server url is " + rollup_server);

// Define a map to store the votes
var votes = {};

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

// Function to handle vote requests
async function handle_vote(data) {
  console.log("Received vote request data " + JSON.stringify(data));
  const voter = data.voter;
  const candidate = data.candidate;

  // Check if the voter has already voted
  if (votes[voter]) {
    console.log("Voter has already voted");
    return "reject";
  }

  // Increment the vote count for the candidate
  if (!votes[candidate]) {
    votes[candidate] = 1;
  } else {
    votes[candidate]++;
  }

  // Mark the voter as having voted
  votes[voter] = true;

  return "accept";
}

// Function to handle get votes requests
async function handle_get_votes(data) {
  console.log("Received get votes request data " + JSON.stringify(data));
  const candidate = data.candidate;

  // Return the vote count for the candidate
  if (!votes[candidate]) {
    return { votes: 0 };
  } else {
    return { votes: votes[candidate] };
  }
}

var handlers = {
  advance_state: handle_advance,
  inspect_state: handle_inspect,
  vote: handle_vote,
  get_votes: handle_get_votes,
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