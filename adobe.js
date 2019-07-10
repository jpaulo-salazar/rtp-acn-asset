const x = require('sync-request');


//handles the payload sent from Boxever
exports.handler = (event, context) => {
    var tokenJson = JSON.parse(getToken());
    var token = tokenJson.access_token;
    var callCampaign = {
        headers: {
            'X-Api-Key': 'a94c131e35f640a8938eba628cf901b9',
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        },
        body: JSON.stringify(event)
    };
    var adobeResponse = sendDataAdobe(callCampaign);
    return (adobeResponse);
};

// get 24hour  token from Adobe service
function getToken() {
    var token = request('POST', 'https://ims-na1.adobelogin.com/ims/exchange/jwt/', {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'client_id=a94c131e35f640a8938eba628cf901b9&client_secret=0709d167-3bea-41fc-8cbc-634fb87f4e82&jwt_token=eyJhbGciOiJSUzI1NiJ9.ew0KICAgICJleHAiOiAyNTM5OTk0MTU5LA0KICAgICJpc3MiOiAiQjhEQzBGQTc1QjQ1Q0FDQjBBNDk1QzQ5QEFkb2JlT3JnIiwNCiAgICAic3ViIjogIjA4Rjg0REQ0NUJCNTY1QjIwQTQ5NUNFQUB0ZWNoYWNjdC5hZG9iZS5jb20iLA0KICAgICJodHRwczovL2ltcy1uYTEuYWRvYmVsb2dpbi5jb20vcy9lbnRfY2FtcGFpZ25fc2RrIjogdHJ1ZSwNCiAgICAiYXVkIjogImh0dHBzOi8vaW1zLW5hMS5hZG9iZWxvZ2luLmNvbS9jL2E5NGMxMzFlMzVmNjQwYTg5MzhlYmE2MjhjZjkwMWI5Ig0KfQ.QCDr4yspRYfQO4XZKXItI3OpNlOdpXvBcRSBkf0GQSa0WQDEjh0N5a5GTVd9Yh1W60U32IRnXFMEvywKmiml9q18NOwHB_O7Jj5XFm85nQPWYPI2RjFmgZzYvkwkFCne1wrliwWu-xssVNm32MbL3ZL0kAP-CwU-8UTn1rqZcXf65ttrZAlzl_cyxOAl9JhpNQI0jRV2her_hXPMsmGtD8nTWI_LgoTuzu04BMJUEsbiDSs5kF_8kznqstgCElFT-2dGKivW_XjWrgcV6KeeknIyFjqMxu7gx9LpFE0c7nzzO3ujBpfRFeaya4VOqwGhBaAKbnRBpbj_Sp8pxfcRHw'
    });
    return (token.getBody().toString());
}

//send Boxever payload plus authentication to Adobe
function sendDataAdobe(callCampaign) {
    var AdobeResponse = request('POST', 'https://mc.adobe.io/acs347ap.adobesandbox.com/campaign/mcaccenturesinptrsd/EVTAirline_flightDelay', callCampaign);
    return AdobeResponse.getBody().toString();

}