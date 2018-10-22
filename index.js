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
  console.log("action: " + req.body.queryResult.action);
  if (req.body.queryResult.action == "input.offers") {
    request(options)
      .then(function (response) {
        // Handle the response
        console.log("In Offers");
        console.log(response.result.channel);
        let resp = {

          fulfillmentText: response.result.offers[0].attributes.Name,
          fulfillmentMessages: [{

            /*  card: {
               title: response.result.offers[0].attributes.Type,
               subtitle: response.result.offers[0].attributes.Name,
               image_uri: response.result.offers[0].attributes.ImageUrl,
               buttons: [{
                 text: "Read More",
                 postback: response.result.offers[0].attributes.LinkUrl
               }]
             }, */
            payload: {
              message: "Hey I am Pacific airlines bot",
              ignoreTextResponse: false,
              platform: "kommunicate",
              metadata: {
                // replace this with metadata JSON supported by kommunicate 
                contentType: "300",
                templateId: "9",
                payload: [{
                  caption: response.result.offers[0].attributes.Name,
                  url: response.result.offers[0].attributes.ImageUrl
                }, {
                  caption: response.result.offers[1].attributes.Name,
                  url: response.result.offers[1].attributes.ImageUrl
                }]
              }
            }
          }, ]
        };
        console.log(resp);
        res.json(resp);
      })
      .catch(function (err) {
        // Deal with the error
        res.json(Errresponse);
      })

  } else if (req.body.queryResult.action == "input.welcome") {
    console.log("In Welcome");
    /* let resp = {
      fulfillmentMessages: [{
        payload: {
          message: "Hello! " + req.body.originalDetectIntentRequest.payload.user_first_name + " How can I help you?",
          platform: "kommunicate"
        }
      }]
    }; */
    let resp = {
      fulfillmentText:"Hello! " + req.body.originalDetectIntentRequest.payload.user_first_name + " How can I help you?"
    };
    res.json(resp);
  } else {
    res.json(Errresponse);
  }

});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));