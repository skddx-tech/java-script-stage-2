const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');

const app = express();

app.use(express.static('.'));
app.use(bodyParser.json());
app.use(cors());

app.get('/api/goods', (req, res) => {
  fs.readFile('./data/catalog.json', 'utf-8', (err, data) => {
    if (err) res.sendStatus(404);
    res.send(data);
  })
});

app.get('/api/cart', (req, res) => {
  fs.readFile('./data/cart.json', 'utf-8', (err, data) => {
    if (err) res.sendStatus(404);
    res.send(data);
  })
});

app.post('/api/addCart', (req, res) => {
  const cart = req.body;
    fs.writeFile('./data/cart.json', JSON.stringify(cart), (err) => {
      if (err) res.sendStatus(404);
      res.sendStatus(200);
    })
});

app.post('/api/removeCart', (req, res) => {
  const cart = req.body;
  fs.writeFile('./data/cart.json', JSON.stringify(cart), (err) => {
    if (err) res.sendStatus(404);
    res.sendStatus(200);
  })
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
