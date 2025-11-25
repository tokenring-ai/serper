const axios = require('axios');
let data = JSON.stringify({
 "url": "https://www.apple.com",
 "includeMarkdown": true
});

let config = {
 method: 'post',
 maxBodyLength: Infinity,
 url: 'https://scrape.serper.dev',
 headers: {
  'X-API-KEY': '--- YOUR API KEY HERE ---',
  'Content-Type': 'application/json'
 },
 data : data
};

async function makeRequest() {
 try {
  const response = await axios.request(config);
  console.log(JSON.stringify(response.data));
 }
 catch (error) {
  console.log(error);
 }
}

makeRequest();