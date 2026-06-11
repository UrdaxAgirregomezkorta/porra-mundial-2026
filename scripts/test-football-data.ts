import dotenv from 'dotenv';
import path from 'path';

async function run() {
  const token = '6618c980b924444c919570e147cc9d3c';
  const url = 'https://api.football-data.org/v4/competitions/WC/matches';
  
  console.log(`Fetching ${url}...`);
  const response = await fetch(url, {
    headers: { 'X-Auth-Token': token },
  });

  console.log("Status:", response.status);
  console.log("Headers:");
  response.headers.forEach((value, name) => console.log(`${name}: ${value}`));

  if (!response.ok) {
    console.log(await response.text());
    return;
  }

  const data = await response.json();
  console.log(`Found ${data.matches?.length || 0} matches.`);
  if (data.matches && data.matches.length > 0) {
    console.log("Example match:", JSON.stringify(data.matches[0], null, 2));
  }
}

run();
