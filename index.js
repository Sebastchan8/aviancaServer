const express = require('express');
const cors = require('cors');
const session = require('express-session');

const app = express();

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('The server is running!');
});

app.use('/api/interactions', require('./routes/interactions.route'));

app.listen(3000, () => {
    console.log('Server on port 3000...')
})