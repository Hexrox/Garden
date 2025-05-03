
const express = require('express');
const cors = require('cors');
const db = require('./db');
const routes = require('./routes/plots');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api', routes);

app.listen(3001, () => {
  console.log('Backend działa na http://localhost:3001');
});
