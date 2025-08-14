const axios = require('axios');
let data = JSON.stringify({
 "q": "apple inc",
 "location": "United States"
});

let config = {
 method: 'post',
 maxBodyLength: Infinity,
 url: 'https://google.serper.dev/news',
 headers: {
  'X-API-KEY': '170091cc0ee87094149f6e4f4879b822ad6ddcc7',
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