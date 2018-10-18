const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

const app = express();

const {
  dialogflow,
  Image,
} = require('actions-on-google')

// Create an app instance
const Dapp = dialogflow()

// Register handlers for Dialogflow intents

Dapp.intent('Default Welcome Intent', conv => {
  conv.ask('Hi, how is it going?')
  conv.ask(`Here's a picture of a cat`)
  conv.ask(new Image({
    url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
    alt: 'A cat',
  }))
})

// Intent in Dialogflow called `Goodbye`
Dapp.intent('Goodbye', conv => {
  conv.close('See you later!')
})

Dapp.intent('Default Fallback Intent', conv => {
  conv.ask(`I didn't understand. Can you tell me something else?`)
})

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

  app.use(express.static(path.join(__dirname, 'public')))
  app.use(bodyParser.json())
  app.post('/fulfillment', app)
  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.post('/testAPI', (req, res) => res.send("TestApi"))
  app.get('/times', (req, res) => {
    let result = ''
    const times = process.env.TIMES || 5
    for (i = 0; i < times; i++) {
      result += i + ' '
    }
    res.send(result)
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`));