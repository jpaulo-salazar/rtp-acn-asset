const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const request = require('request-promise');
const app = express();

const options = {
  method: 'POST',
  uri: 'https://api-ap-southeast-2-production.boxever.com/v2/callFlows',
  body: {
    "context": {
      "browserId": "1920c00f-b9ff-4e3e-b2d8-bcc9258ea9b6",
      "clientKey": "scuatvAGHM9ke1RfXDVgJmE61D5HobSw",
      "channel": "WEB",
      "language": "EN",
      "currencyCode": "SGD",
      "uri": "Home Page Post Login",
      "region": "Destinations",
      "pointOfSale": "accentureshowcase.com"
    }
  },
  json: true
  // JSON stringifies the body automatically
};
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use(express.static(path.join(__dirname, 'public')))
app.use(bodyParser.json())
app.post('/fulfillment', (req, res) => {
  console.log(req.body);
  const Errresponse = {
    fulfillmentText: "Your API call does not work fine !",
  }

  request(options)
    .then(function (response) {
      // Handle the response
      console.log(response.result.channel);
      let resp = {
        fulfillmentText: response.result.offers[0].attributes.Name,
        fulfillmentMessages: [{
          card: {
            title: response.result.offers[0].attributes.Type,
            subtitle: response.result.offers[0].attributes.Name,
            image_uri: response.result.offers[0].attributes.ImageUrl,
            buttons: [{
              text: "Read More",
              postback: "https://assistant.google.com/"
            }]
          }
        }]
      };
      res.json(resp);
    })
    .catch(function (err) {
      // Deal with the error
      res.json(Errresponse);
    })



});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));