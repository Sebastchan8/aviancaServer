const connection = require('../config/db');

//*********AUTHENTICATION */

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [user] = await connection.query(`
        SELECT 
        *
        FROM users
        WHERE email = ?`,
        [email]
        );
        
        if (user.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user[0].password == password) {
            return res.json({ message: 'Login successfully!', user: user[0] });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Log in failed' });
    }
};

exports.logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).send('Log out failed');
            } else {
                res.json({ message: 'Logout successfully!'});
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Log out failed' });
    }
};


exports.signup = async (req, res) => {
    try {
        const { firstname, lastname, phone, address, card, email, password } = req.body;

        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email is already in use' });
        }

        const [result] = await connection.query(
            'INSERT INTO users (firstname, lastname, phone, address, card, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [firstname, lastname, phone, address, card, email, password]
        );

        return res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering the user' });
    }
};


//***********************FLIGHTS********************* */

exports.getFlights = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT 
                *
            FROM flights`);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.getCities = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT 
                *
            FROM cities`);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.getAerolines = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT 
                *
            FROM aerolines`);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.getFlights = async (req, res) => {
    try {
        const [rows] = await connection.query(`
            SELECT 
                *
            FROM flights`);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.getUserData = async (req, res) => {
    try {
        const user_id = req.params.user_id

        const [rows] = await connection.query(`
            SELECT 
                *
            FROM users WHERE user_id = ?`, [user_id]);
        res.json(rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.updateUserData = async (req, res) => {
    try {
        const user_id = req.params.user_id
        const { firstname, lastname, phone, address, card, email, password } = req.body

        const [existingUsers] = await connection.query(
            'SELECT * FROM users WHERE email = ? AND NOT user_id = ?',
            [email, user_id]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Email is already in use' });
        }

        const [rows] = await connection.query(`
            UPDATE users 
            SET firstname = ?, lastname = ?, phone = ?, address = ?, card = ?, email = ?, password = ?
            WHERE user_id = ?`, 
            [firstname, lastname, phone, address, card, email, password, user_id]);
        res.json(rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting updated error!');
    }
}


//--------




exports.addChannel = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const [rows] = await connection.query('INSERT INTO channels(username, email, password) VALUES (?, ?, ?)',
            [username, email, password]);
        res.send({ rows });
    } catch (error) {
        console.log(error);
        res.status(500).send('Saving channel error!');
    }
}

exports.getChannel = async (req, res) => {
    try {
        const channelId = req.params.id;
        const visitorChannelId = req.session.user.channel_id;

        let subscription_status;
        if(channelId == visitorChannelId){
            subscription_status = 0;
        }else{
            const [sub] = await connection.query(`
                SELECT * FROM subscribers WHERE channel_id_main = ? AND channel_id_subscriber = ?`,
            [channelId, visitorChannelId]);
            if(sub.length === 0){
                subscription_status = -1;
            }else{
                subscription_status = 1;
            }

        }
        const [rows] = await connection.query(`
            SELECT 
                c.*,
                COUNT(DISTINCT s.subscription_id) num_subscribers,
                COUNT(DISTINCT v.video_id) num_videos
            FROM channels c
            LEFT JOIN subscribers s ON c.channel_id = s.channel_id_main
            LEFT JOIN videos v ON c.channel_id = v.channel_id
            WHERE c.channel_id = ?
            GROUP BY c.channel_id`,
        [channelId]);
        res.json([{ ...rows[0], subscription_status}]);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting channel error!');
    }
}

exports.deleteChannel = async (req, res) => {
    try {
        const channel_id = req.session.user.channel_id
        const [rows] = await connection.query('DELETE FROM channels WHERE channel_id = ?', [channel_id]);
        const [rows2] = await connection.query('DELETE FROM comments WHERE channel_id = ?', [channel_id]);
        const [rows3] = await connection.query('DELETE FROM ratings WHERE channel_id = ?', [channel_id]);
        const [rows4] = await connection.query('DELETE FROM subscribers WHERE channel_id_subscriber = ?', [channel_id]);
        const [rows5] = await connection.query('DELETE FROM videos WHERE channel_id = ?', [channel_id]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Deleting channel error!');
    }
}
