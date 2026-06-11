import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const apiKey = process.env.API_FOOTBALL_KEY;

async function run() {
  console.log("Fetching live scores from API-Football...");
  const response = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026', {
    headers: { 'x-apisports-key': apiKey as string },
    cache: 'no-store'
  });

  if (!response.ok) {
    console.error("Failed to fetch from API-Football", response.status, response.statusText);
    return;
  }

  const data = await response.json();
  if (data.errors && Object.keys(data.errors).length > 0) {
    console.error("API Errors:", data.errors);
  }
  console.log(`Found ${data.response?.length || 0} fixtures.`);
  if (data.response && data.response.length > 0) {
      console.log("First fixture example:");
      console.log(JSON.stringify(data.response[0], null, 2));
      
      const active = data.response.filter((f: any) => ['1H', '2H', 'HT', 'FT', 'PEN', 'AET', 'NS'].includes(f.fixture.status.short));
      console.log(`Found ${active.length} active/recent/pending matches`);
      console.log("Statuses found:", new Set(data.response.map((f: any) => f.fixture.status.short)));
  }
}

run().catch(console.error);
