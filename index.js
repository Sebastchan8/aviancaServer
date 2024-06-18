const express = require('express');
const cors = require('cors');
const mailScheduler = require('./mailer/mail_shceduler');

const app = express();

app.use(express.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('The server is running!');
});

app.use('/api/interactions', require('./routes/interactions.route'));

app.listen(3000, () => {
    console.clear();
    mailScheduler.scheduleMailNotification('*/5 * * * *');
    console.log('Server on port 3000...');

})