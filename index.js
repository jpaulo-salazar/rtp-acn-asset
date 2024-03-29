const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const PORT = process.env.PORT || 5000;
const request = require('request-promise');
const app = express();
const box_key = "scuatvAGHM9ke1RfXDVgJmE61D5HobSw";
var schedule = require('node-schedule');
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
const amd_auth_option = {
  method: 'POST',
  uri: 'https://test.api.amadeus.com/v1/security/oauth2/token',
  /*headers: {
    "Content-Type":"application/x-www-form-urlencoded"
  },*/
  form: {
    "client_id": "oaMnCt4svBPFVQQI4FMQRIUz6BzPTnPJ",
    "client_secret": "y0OJzwkYXjAqfAaG",
    "grant_type": "client_credentials"
  },
  json: true

};
var amd_test_option = {
  method: 'GET',
  uri: 'https://test.api.amadeus.com/v1/shopping/flight-offers?origin=SIN&destination=BKK&departureDate=2019-08-01&returnDate=2019-08-28&nonStop=true',
  headers: {
    "Accept": "application/vnd.amadeus+json",
    "Authorization": "Bearer m1B4IvUE2iRIF8u9GHqXc8GYGQp0"
  },
  json: true
};
var Airtable = require('airtable');
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: 'keyJEKq5757mM7GiT'
});
var base = Airtable.base('appT9esZyn76uGPXy');

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
//================================================================
//Testing Amadeues Api
/*var j = schedule.scheduleJob('14 * * * *', function () {
  request(amd_auth_option)
    .then(function (response) {
      console.log(response.access_token);
      amd_test_option.headers.Authorization = "Bearer " + response.access_token;
    })
    .catch(function (err) {
      console.log(err);
    })
});*/
async function fetchAirtableOffer(boxOffer) {
  let offer = boxOffer.split(";");
  offer.shift();
  let offerDetails = [];
  for (let eachOffer of offer) {
    var temp = eachOffer.split("+");
    var offerName = temp[0].trim();
    var tripType = parseInt(temp[1]);
    var formula;
    if (tripType == 0) {
      formula = 'AND(name="' + offerName + '")';
    } else {
      formula = 'AND(name="' + offerName + '",tripType=' + tripType + ')';
    }

    console.log("Forumla " + formula);
    let promise = new Promise((resolve, reject) => {
      base('Imported table').select({
        view: 'Grid view',
        filterByFormula: formula
      }).firstPage(function (err, records) {
        if (err) {
          console.error(err);
          return;
        }
        let tempOffer = -1;
        if (records.length !== 0)
          tempOffer = records[0].fields;
        resolve(tempOffer);
      });
    });
    let result = await promise;
    if (result !== -1) {
      console.log(result);
      offerDetails.push(result);
    }

  }
  console.log("offer length" + offerDetails.slice(0, 10).length);
  return offerDetails.slice(0, 10);
}

async function fetchAirtablePackageOffer(boxOffer) {
  let offer = boxOffer.split(";");
  offer.shift();
  let offerDetails = [];
  var temp = offer[0].split("+");
  var offerName = temp[0].trim();
  var tripType = parseInt(temp[1]);
  var custSegment = temp[2].trim().toLowerCase();
  var formula;
  if (custSegment === "na") {
    formula = 'AND(Find("' + offerName + '",{name}))';
  } else if (tripType !== 0 && custSegment === "na") {
    formula = 'AND(Find("' + offerName + '",{name}))';//,tripType=' + tripType + ')';
  } else {
    formula = 'AND(Find("' + offerName + '",{name}),offerSegment="' + custSegment + '")';// + tripType + ',offerSegment="' + custSegment + '")';
  }
  console.log("Forumla " + formula);
  let promise = new Promise((resolve, reject) => {
    base('Imported table').select({
      view: 'Grid view',
      filterByFormula: formula
    }).firstPage(function (err, records) {
      if (err) {
        console.error(err);
        return;
      }
      let tempOffer = [];
      let offerNames =[];
      if (records.length !== 0)
        records.forEach(function (element) {
          if(!(offerNames.includes(element.fields.name)))
          {
            offerNames.push(element.fields.name); 
            tempOffer.push(element.fields);
          }
         
        });
      resolve(tempOffer);
    });
  });
  let result = await promise;
  if (result.length >0) {
    console.log(result);
    offerDetails = result;
  }


  console.log("offer length" + offerDetails.slice(0, 10).length);
  return offerDetails.slice(0, 10);
}

app.post('/fetchOffers', (req, res) => {

  console.log(req.body);
  const box_options = {
    method: 'POST',
    uri: 'https://api-ap-southeast-2-production.boxever.com/v2/callFlows',
    body: req.body,
    json: true
    // JSON stringifies the body automatically
  };
  request(box_options)
    .then(function (response) {
      console.log("Called Boxever Flow -- Response Below");
      fetchAirtableOffer(response.reco4).then(x => res.json(x));

    })
    .catch(function (err) {
      // Deal with the error
      // res.json(Errresponse);
    });

});
app.post('/packageOffers', (req, res) => {

  console.log(req.body);
  const box_options = {
    method: 'POST',
    uri: 'https://api-ap-southeast-2-production.boxever.com/v2/callFlows',
    body: req.body,
    json: true
    // JSON stringifies the body automatically
  };
  request(box_options)
    .then(function (response) {
      console.log("Called Boxever Flow -- Response Below");
      console.log(response.reco1);
      fetchAirtablePackageOffer(response.reco1).then(x => res.json(x));

    })
    .catch(function (err) {
      // Deal with the error
      // res.json(Errresponse);
    });

});


app.get('/dapi', (req, res) => {
  console.log(req.body);
  /*request(amd_auth_option)
  .then(function (response){

  })*/
  request(amd_auth_option)
    .then(function (response) {
      console.log(response.access_token);
      amd_test_option.headers.Authorization = "Bearer " + response.access_token;
      request(amd_test_option)
        .then(function (response) {
          console.log(response);
          res.json(response);
        })
        .catch(function (err) {
          console.log(err);
          res.json(err);
        })
    });
});
//================================================================
//Testing Campaign call
app.post('/campaign', (req, res) => {
  console.log(req.body);
  var tokenJson = JSON.parse(getToken());
  var token = tokenJson.access_token;
});

function getToken() {
  var token = request('POST', 'https://ims-na1.adobelogin.com/ims/exchange/jwt/', {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'client_id=87902aade48947d4a06192428326d847&client_secret=644baa93-8268-40ce-8c83-ab69f9564546&jwt_token=eyJhbGciOiJSUzI1NiJ9.ew0KICAgICJleHAiOiAxNTQ5NTkzNzk2LA0KICAgICJpc3MiOiAiQjhEQzBGQTc1QjQ1Q0FDQjBBNDk1QzQ5QEFkb2JlT3JnIiwNCiAgICAic3ViIjogIjM5NUYxMjJDNUMzQzM2OEQwQTQ5NURBREB0ZWNoYWNjdC5hZG9iZS5jb20iLA0KICAgICJodHRwczovL2ltcy1uYTEuYWRvYmVsb2dpbi5jb20vcy9lbnRfY2FtcGFpZ25fc2RrIjogdHJ1ZSwNCiAgICAiYXVkIjogImh0dHBzOi8vaW1zLW5hMS5hZG9iZWxvZ2luLmNvbS9jLzg3OTAyYWFkZTQ4OTQ3ZDRhMDYxOTI0MjgzMjZkODQ3Ig0KfQ.AyZoPs4yC7S03Td5tsDKCiAej7ARUgQRXb0Bhlr-UAmKG5JFEnNuMX6hEGe5ePiu2r3wTjKEBOJdt6E1QQD4aq1i2VDZObYd15erId5CP-EOmAAIQS5Al9C9cF79Lg4NqOJIcnQ5R2XtQ7EBzDg3EH_Mtw8xwM_oOhxgLAtWrfHQikvd3supC80tGGEtYTG0ApgJMPbMGDAI6yrA1dPZxBv3Xmt2LuQK9ZwoEg3j3HKywYeX9vDq_gsLRXQh_yugOtGGwQ1VD40ZkQeXF09D2yBZqpTQ--SPdMuGm01MqXW47wacxo1Yv2lzg6fBE7RtnD0oPZqdkcMula9PcOR5Rg'
  });
  return (token.getBody().toString());
}
//================================================================
app.post('/fulfillment', (req, res) => {
  console.log(req.body);
  const Errresponse = {
    fulfillmentText: "Oh no! Looks like something went wrong at our end. We apologize for the inconvenience caused. Please try again in some time",
  }
  console.log("action: " + req.body.queryResult.action);
  if (req.body.queryResult.action == "input.offers") {
    //identity_event.uri = identity_event.uri + req.body.originalDetectIntentRequest.payload;
    console.log(req.body.originalDetectIntentRequest.payload);
    options.body.context.browserId = req.body.originalDetectIntentRequest.payload.browser_id;
    options.body.context.channel = req.body.originalDetectIntentRequest.payload.channel;
    options.body.context.currencyCode = req.body.originalDetectIntentRequest.payload.currency;
    options.body.context.language = req.body.originalDetectIntentRequest.payload.language;
    options.body.context.pointOfSale = req.body.originalDetectIntentRequest.payload.pos;

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
              message: "Here is what I found: ",
              ignoreTextResponse: false,
              platform: "kommunicate",
              /*  metadata: {
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
               } */
              metadata: {
                contentType: "300",
                templateId: "7",
                payload: {
                  headerImgSrc: response.result.offers[0].attributes.ImageUrl,
                  headerText: "Destinations",
                  elements: [{
                      imgSrc: response.result.offers[0].attributes.ImageUrl,
                      title: response.result.offers[0].attributes.Name,
                      description: response.result.offers[0].description,
                      action: {
                        url: response.result.offers[0].attributes.LinkUrl,
                        type: "link"
                      }
                    },
                    {
                      imgSrc: response.result.offers[1].attributes.ImageUrl,
                      title: response.result.offers[1].attributes.Name,
                      description: response.result.offers[1].description,
                      action: {
                        url: response.result.offers[1].attributes.LinkUrl,
                        type: "link"
                      }
                    }

                  ],
                  buttons: [{
                    name: "See us on facebook",
                    action: {
                      url: "https://www.google.com",
                      type: "link"
                    }
                  }]
                }

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
      resp.fulfillmentText = "Hello " + req.body.originalDetectIntentRequest.payload.firstname + "! How can I help you? \nWould you like me to inspire you with a travel destination, an experience or a product you’ll probably love? BTW, I also have some exclusive offers just for your too!  "

    } else {
      resp.fulfillmentText = "Hello! How can I help you?"

    }
    res.json(resp);
  } else if (req.body.queryResult.action == "input.offertype") {
    var offType = "";
    var noOfOffers = "";
    if (req.body.queryResult.parameters.destination) {
      offType = "destination";
      noOfOffers = req.body.queryResult.parameters.numberofoffers ? req.body.queryResult.parameters.numberofoffers : "3";
    } else if (req.body.queryResult.parameters.experience) {
      offType = "experience";
      noOfOffers = req.body.queryResult.parameters.numberofoffers ? req.body.queryResult.parameters.numberofoffers : "3";
    } else if (req.body.queryResult.parameters.product) {
      offType = "product";
      noOfOffers = req.body.queryResult.parameters.numberofoffers ? req.body.queryResult.parameters.numberofoffers : "3";
    }

    const offerTypesInput = {
      method: 'GET',
      uri: 'https://api-ap-southeast-2-production.boxever.com/v1.2/event/create.json?client_key=' + box_key +
        '&message={"browser_id":"' + req.body.originalDetectIntentRequest.payload.browser_id + '",' +
        '"channel":"' + req.body.originalDetectIntentRequest.payload.channel + '",' +
        '"type":"VIEW",' +
        '"language":"' + req.body.originalDetectIntentRequest.payload.language + '",' +
        '"currency":"' + req.body.originalDetectIntentRequest.payload.currency + '",' +
        '"page":"' + req.body.originalDetectIntentRequest.payload.page + '",' +
        '"pos":"' + req.body.originalDetectIntentRequest.payload.pos + '",' +
        '"session_data":{"offerType":"' + offType + '",' +
        '"numOffers":"' + noOfOffers + '"}}'
    };

    options.body.context.browserId = req.body.originalDetectIntentRequest.payload.browser_id;
    options.body.context.channel = req.body.originalDetectIntentRequest.payload.channel;
    options.body.context.currencyCode = req.body.originalDetectIntentRequest.payload.currency;
    options.body.context.language = req.body.originalDetectIntentRequest.payload.language;
    options.body.context.pointOfSale = req.body.originalDetectIntentRequest.payload.pos;
    options.body.context.uri = "chatbot";
    options.body.context.region = "scenario1";

    console.log("#### OFFERTYPESINPUT ####");
    console.log(offerTypesInput);

    request(offerTypesInput)
      .then(function (response) {
        console.log("in first call - offerTypesInput");
        console.log("#### OPTIONS ####");
        console.log(options);
        request(options)
          .then(function (response) {
            console.log("in second call - options");
            console.log(JSON.stringify(response));
            var length = response.result.offers.length;
            console.log("length = " + length);
            if (noOfOffers < length) {
              length = noOfOffers;
            }
            let elements = [];
            for (var i = 0; i < length; i++) {
              let data = {
                imgSrc: response.result.offers[i].attributes.ImageUrl,
                title: response.result.offers[i].attributes.Name,
                description: response.result.offers[i].description,
                action: {
                  url: response.result.offers[i].attributes.LinkUrl,
                  type: "link"
                }

              }
              elements.push(data);
            }
            let resp = {
              fulfillmentText: response.result.offers[0].attributes.Name,
              fulfillmentMessages: [{
                payload: {
                  message: "I bet you’ll like these " + offType + "(s) \nClick to know more if any of these " + offType + "(s) strikes your fancy. ",
                  ignoreTextResponse: false,
                  platform: "kommunicate",
                  metadata: {
                    contentType: "300",
                    templateId: "7",
                    payload: {
                      headerImgSrc: response.result.offers[0].attributes.ImageUrl,
                      headerText: offType,
                      elements: elements,
                      /* buttons: [{
                        name: "See us on facebook",
                        action: {
                          url: "https://www.google.com",
                          type: "link"
                        }
                      }] */
                    }

                  }
                }
              }, ]
            };
            console.log(resp);
            res.json(resp);
          })
          .catch(function (err) {
            console.log(err);
            res.json(Errresponse);
          })
      })
      .catch(function (err) {
        console.log(err);
        res.json(Errresponse);
      })

  } else if (req.body.queryResult.action == "input.loyalty") {
    console.log(req.body.originalDetectIntentRequest.payload);
    options.body.context.browserId = req.body.originalDetectIntentRequest.payload.browser_id;
    options.body.context.channel = req.body.originalDetectIntentRequest.payload.channel;
    options.body.context.currencyCode = req.body.originalDetectIntentRequest.payload.currency;
    options.body.context.language = req.body.originalDetectIntentRequest.payload.language;
    options.body.context.pointOfSale = req.body.originalDetectIntentRequest.payload.pos;
    options.body.context.uri = "chatbot",
      options.body.context.region = "scenario2";
    request(options)
      .then(function (response) {
        // Handle the response
        // console.log(response)
        console.log("In Loyalty");
        // console.log("Loyalty Response")
        console.log(response);
        var length = response.result.offers.length;
        console.log("length = " + length);
        if (noOfOffers < length) {
          length = noOfOffers;
        }
        let elements = [];
        for (var i = 0; i < length; i++) {
          let data = {
            imgSrc: response.result.offers[i].attributes.ImageUrl,
            title: response.result.offers[i].attributes.Name,
            description: response.result.offers[i].description,
            action: {
              url: response.result.offers[i].attributes.LinkUrl,
              type: "link"
            }

          }
          elements.push(data);
        }
        let resp = {
          fulfillmentText: response.result.offers[0].attributes.Name,
          fulfillmentMessages: [{
            payload: {
              message: "I've picked these just for you \nLike any of them? Click on the visuals if any of these exclusives strikes your fancy.",
              ignoreTextResponse: false,
              platform: "kommunicate",
              metadata: {
                contentType: "300",
                templateId: "7",
                payload: {
                  headerImgSrc: response.result.offers[0].attributes.ImageUrl,
                  headerText: response.result.offers[0].attributes.Type + "s",
                  elements: elements,
                  buttons: [{
                    name: "Check out our blogs",
                    action: {
                      url: "https://publish619.adobedemo.com/content/sia/Tokyo-description.html",
                      type: "link"
                    }
                  }]
                }

              }
            }
          }, ]
        };
        console.log(resp);
        res.json(resp);
      })
      .catch(function (err) {
        // Deal with the error
        console.log(err);
        res.json(Errresponse);
      })
  } else if (req.body.queryResult.action == "input.bookflight") { //==================book flight=================
    console.log("==================book flight parameters=================");
    console.log(req.body.queryResult.parameters);
    var startDateSplit = req.body.queryResult.parameters.depart.split("T");
    var startDate = startDateSplit[0];
    var endDateSplit = req.body.queryResult.parameters.return.split("T");
    var endDate = endDateSplit[0];
    var destination = req.body.queryResult.parameters.countries;
    console.log(startDate);
    console.log(endDate);
    console.log("==================book flight parameters close=================");
    request(amd_auth_option)
      .then(function (response) {
        console.log(response.access_token);
        amd_test_option.headers.Authorization = "Bearer " + response.access_token;
        amd_test_option.uri = 'https://test.api.amadeus.com/v1/shopping/flight-offers?origin=SIN&destination=' + destination + "&departureDate=" + startDate + "&returnDate=" + endDate + "&nonStop=true&currency=SGD";
        request(amd_test_option)
          .then(function (response) {
            // Handle the response
            // console.log(response)
            console.log("In Book Flight");
            // console.log("Loyalty Response")
            console.log(response);
            let resp = {
              fulfillmentText: "DAPI Test",
              fulfillmentMessages: [{
                payload: {
                  message: "I've picked these flights just for you",
                  ignoreTextResponse: false,
                  platform: "kommunicate",
                  metadata: {
                    contentType: "300",
                    templateId: "10",
                    payload: [{
                      title: "SIN ->" + req.body.queryResult.parameters.countries,
                      subtitle: "S$" + response.data[0].offerItems[0].price.total,
                      header: {
                        //overlayText: req.body.queryResult.parameters.countries,
                        imgSrc: "https://publish619.adobedemo.com/content/dam/rtp-asset/destinations/Bangkok%402x.png"
                      },
                      description: startDate + " to " + endDate,
                      titleExt: response.data[0].offerItems[0].services[0].segments[0].flightSegment.carrierCode + " " + response.data[0].offerItems[0].services[0].segments[0].flightSegment.number,
                      buttons: [{
                        name: "Link Button",
                        action: {
                          type: "Book - Doesnt work yet",
                          payload: {
                            url: "https://www.google.com"
                          }
                        }
                      }]
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
            console.log(err);
            res.json(Errresponse);
          })
      });
  } else {
    res.json(Errresponse);
  }

});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.get('/', (req, res) => res.render('pages/index'));
app.listen(PORT, () => console.log(`Listening on ${ PORT }`));