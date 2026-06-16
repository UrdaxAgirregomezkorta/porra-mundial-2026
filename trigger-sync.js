const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf-8');
const secret = env.split('CRON_SECRET=')[1].split('\n')[0].trim();

console.log("Triggering sync with secret:", secret.substring(0, 5) + "...");

fetch('http://localhost:3000/api/cron/sync', { 
  headers: { 'Authorization': 'Bearer ' + secret } 
})
.then(r => r.json())
.then(data => {
  console.log("Sync Response:", data);
})
.catch(err => {
  console.error("Sync Error:", err);
});
