const axios = require("axios");
const data = JSON.stringify({
 q: "apple inc",
 location: "United States",
});

const config = {
 method: "post",
 maxBodyLength: Infinity,
 url: "https://google.serper.dev/search",
 headers: {
  "X-API-KEY": "--- YOUR API KEY HERE ---",
  "Content-Type": "application/json",
 },
 data: data,
};

async function makeRequest() {
 try {
  const response = await axios.request(config);
  console.log(JSON.stringify(response.data));
 } catch (error) {
  console.log(error);
 }
}

// noinspection JSIgnoredPromiseFromCall
makeRequest();
