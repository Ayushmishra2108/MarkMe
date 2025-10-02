// Temporary script to clean orphaned members from a team using the backend API
// Usage: node cleanTeamMembers.js

const fetch = require('node-fetch');

async function cleanTeam(teamName = "core team") {
  const res = await fetch('http://localhost:8080/api/admin/teams/clean-members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ teamName })
  });
  const data = await res.json();
  console.log('Cleanup result:', data);
}

cleanTeam();
