const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const request = require('request-promise');
const app = express();
const box_key = "scuatvAGHM9ke1RfXDVgJmE61D5HobSw";
const options = {
  method: 'POST',
  uri: 'https://api-ap-southeast-2-production.boxever.com/v2/callFlows',
  body: {
    "context": {
      "browserId": "1920c00f-b9ff-4e3e-b2d8-bcc9258ea9b6",
      "clientKey": box_key,
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

const identity_event = {
  method: 'GET',
  uri: 'https://api-ap-southeast-2-production.boxever.com/v1.2/event/create.json?client_key=scuatvAGHM9ke1RfXDVgJmE61D5HobSw&message=',
  json: true

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
    //identity_event.uri = identity_event.uri + req.body.originalDetectIntentRequest.payload;
     console.log(req.body.originalDetectIntentRequest.payload);
    //console.log("Identity Event");
    //request(identity_event)
    // .then(function (response) {
    // Handle the response
    //  console.log(response);
    request(options)
      .then(function (response) {
        // Handle the response
        // console.log(response)
        console.log("In Offers");
        console.log("Offers Response")
        console.log(response);
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

    // })



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
    console.log("Name: " + req.body.originalDetectIntentRequest.payload.firstname);
    let resp = {
      fulfillmentText: ""
    };
    if (req.body.originalDetectIntentRequest.payload.firstname != null) {
      resp.fulfillmentText = "Hello " + req.body.originalDetectIntentRequest.payload.firstname + "! How can I help you?"

    } else {
      resp.fulfillmentText = "Hello! How can I help you?"

    }
    res.json(resp);
  } else {
    res.json(Errresponse);
  }

});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));