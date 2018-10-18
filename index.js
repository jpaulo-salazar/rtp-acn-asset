const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

const app = express();
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

  app.use(express.static(path.join(__dirname, 'public')))

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'ejs')
  app.get('/', (req, res) => res.render('pages/index'))
  app.get('/testAPI', (req, res) => res.send("TestApi"))
  app.get('/times', (req, res) => {
    let result = ''
    const times = process.env.TIMES || 5
    for (i = 0; i < times; i++) {
      result += i + ' '
    }
    res.send(result)
  })
  app.listen(PORT, () => console.log(`Listening on ${ PORT }`));