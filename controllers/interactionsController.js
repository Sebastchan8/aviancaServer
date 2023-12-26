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
            // NOTIFICATION AND STATUS VIAJES
            // const [rows] = await connection.query(
            //     'UPDATE reservations set status = 1 where  = ?',
            //     [ticket_id]
            // );
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
                res.json({ message: 'Logout successfully!' });
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
        //DEFAULT NOTIFICATION---------------------------------------------
        ///////////////////////////////
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

exports.getAvailableFlights = async (req, res) => {
    try {
        const { departure_id, destination_id, departure_date, destination_date, adults, children, round } = req.body
        let query, arguments
        if (departure_id == destination_id) {
            query = `
            SELECT
                f.flight_id,
                al.aeroline_name,
                al.aeroline_img,
                d.id AS departure_city_id,
                d.city AS departure_city,
                f.departure_date,
                a.id AS destination_city_id,
                a.city AS destination_city,
                f.destination_date,
                f.adult_price,
                f.child_price,
                f.adult_available,
                f.child_available,
                EXISTS (
                    SELECT 1
                    FROM flights r
                    WHERE r.departure_city_id = f.destination_city_id
                        AND r.destination_city_id = f.departure_city_id
                        AND r.departure_date > f.destination_date
                ) AS round
            FROM
                flights f
                JOIN aerolines al ON f.aeroline_id = al.aeroline_id
                JOIN cities d ON f.departure_city_id = d.id
                JOIN cities a ON f.destination_city_id = a.id
            WHERE
                f.departure_city_id = ?
                OR f.destination_city_id = ?`
            arguments = [departure_id, destination_id]
        } else {
            query = `
                SELECT
                    f.flight_id,
                    al.aeroline_name,
                    al.aeroline_img,
                    d.id AS departure_city_id,
                    d.city AS departure_city,
                    f.departure_date,
                    a.id AS destination_city_id,
                    a.city AS destination_city,
                    f.destination_date,
                    f.adult_price,
                    f.child_price,
                    f.adult_available,
                    f.child_available,
                    EXISTS (
                        SELECT 1
                        FROM flights r
                        WHERE r.departure_city_id = f.destination_city_id
                            AND r.destination_city_id = f.departure_city_id
                            AND r.departure_date > f.destination_date
                    ) AS round
                FROM
                    flights f
                    JOIN aerolines al ON f.aeroline_id = al.aeroline_id
                    JOIN cities d ON f.departure_city_id = d.id
                    JOIN cities a ON f.destination_city_id = a.id
                WHERE
                    f.departure_city_id = ?
                    AND f.destination_city_id = ?
                    AND f.departure_date LIKE ?
                    AND f.adult_available >= ?
                    AND f.child_available >= ?`
            arguments = [departure_id, destination_id, `%${departure_date}%`, adults, children]
        }
        const [rounded] = await connection.query(`
            SELECT *
            FROM flights
            WHERE departure_city_id = ?
            AND destination_city_id = ?
            AND departure_date LIKE ?`,
            [destination_id, departure_id, `%${destination_date}%`]);

        const [rows] = await connection.query(query, arguments);

        if ((round && rounded.length > 0) || !round) {
            res.json({ flights: rows, round: round });
        } else {
            res.json({ flights: [], round: round });
        }

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

exports.getFlight = async (req, res) => {
    try {
        const flight_id = req.params.flight_id
        const [rows] = await connection.query(`
        SELECT
            f.flight_id,
            al.aeroline_name,
            al.aeroline_img,
            d.id AS departure_city_id,
            d.city AS departure_city,
            f.departure_date,
            a.id AS destination_city_id,
            a.city AS destination_city,
            f.destination_date,
            f.adult_price,
            f.child_price,
            f.adult_available,
            f.child_available
        FROM
            flights f
            JOIN aerolines al ON f.aeroline_id = al.aeroline_id
            JOIN cities d ON f.departure_city_id = d.id
            JOIN cities a ON f.destination_city_id = a.id
        WHERE
            f.flight_id = ?`, [flight_id]);
        console.log("EL ID: ", rows[0]);
        res.json(rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.getRoundedFlights = async (req, res) => {
    try {
        const flight_id = req.params.flight_id

        const [flight] = await connection.query(`
        SELECT
            f.flight_id,
            al.aeroline_name,
            al.aeroline_img,
            d.id AS departure_city_id,
            d.city AS departure_city,
            f.departure_date,
            a.id AS destination_city_id,
            a.city AS destination_city,
            f.destination_date,
            f.adult_price,
            f.child_price,
            f.adult_available,
            f.child_available
        FROM
            flights f
            JOIN aerolines al ON f.aeroline_id = al.aeroline_id
            JOIN cities d ON f.departure_city_id = d.id
            JOIN cities a ON f.destination_city_id = a.id
        WHERE
            f.flight_id = ?`, [flight_id]);

        const { departure_city_id, destination_city_id, destination_date } = flight[0]

        const [rows] = await connection.query(`
        SELECT
            f.flight_id,
            al.aeroline_name,
            al.aeroline_img,
            d.id AS departure_city_id,
            d.city AS departure_city,
            f.departure_date,
            a.id AS destination_city_id,
            a.city AS destination_city,
            f.destination_date,
            f.adult_price,
            f.child_price,
            f.adult_available,
            f.child_available
        FROM
            flights f
            JOIN aerolines al ON f.aeroline_id = al.aeroline_id
            JOIN cities d ON f.departure_city_id = d.id
            JOIN cities a ON f.destination_city_id = a.id
        WHERE
            f.destination_city_id = ?
            AND f.departure_city_id = ?
            AND f.departure_date > ?`,
            [departure_city_id, destination_city_id, destination_date]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

// -----------------------


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

exports.getUserNotifications = async (req, res) => {
    try {
        const user_id = req.params.user_id

        const [rows] = await connection.query(`
            SELECT 
                *
            FROM notifications WHERE user_id = ?`, [user_id]);
        res.json(rows);
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

exports.getUserTickets = async (req, res) => {
    try {
        const user_id = req.params.user_id

        const [all] = await connection.query(
            'SELECT * FROM reservations WHERE user_id = ?',
            [user_id]
        );

        let ticketQuery = `
        SELECT
            f.flight_id,
            al.aeroline_name,
            al.aeroline_img,
            d.id AS departure_city_id,
            d.city AS departure_city,
            f.departure_date,
            a.id AS destination_city_id,
            a.city AS destination_city,
            f.destination_date,
            f.adult_price,
            f.child_price,
            f.adult_available,
            f.child_available
        FROM
            flights f
            JOIN aerolines al ON f.aeroline_id = al.aeroline_id
            JOIN cities d ON f.departure_city_id = d.id
            JOIN cities a ON f.destination_city_id = a.id
        WHERE
            f.flight_id = ?`

        let tickets = []

        for (let i = 0; i < all.length; i++) {
            let returnTicket = [{}]
            let [departureTicket] = await connection.query(ticketQuery, [all[i].departure_flight_id])
            if (all[i].return_flight_id != null) {
                [returnTicket] = await connection.query(ticketQuery, [all[i].return_flight_id])
            }
            tickets.push({
                "reservation_id": all[i].reservation_id,
                "user_id": all[i].user_id,
                "adults": all[i].adults,
                "children": all[i].children,
                "total": all[i].total,
                "status": all[i].status,
                "departureFlight": departureTicket[0],
                "returnFlight": returnTicket[0]
            })
        }

        res.json(tickets);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting updated error!');
    }
}

exports.buyTicket = async (req, res) => {
    try {
        const user_id = req.params.user_id
        const { departure_flight_id, return_flight_id, adults, children, total } = req.body
        console.log("re id: ", return_flight_id)

        const [rows] = await connection.query(
            'INSERT INTO reservations values (null, ?, ?, ?, ?, ?, ?, 0)',
            [user_id, departure_flight_id, return_flight_id, adults, children, total]
        );

        let query, arguments
        if (return_flight_id) {
            query = `UPDATE flights 
                    set adult_available = adult_available - ?,
                    child_available = child_available - ?
                    WHERE flight_id IN (?, ?)`
            arguments = [adults, children, departure_flight_id, return_flight_id]
        } else {
            query = `UPDATE flights 
                    set adult_available = adult_available - ?,
                    child_available = child_available - ?
                    WHERE flight_id = ?`
            arguments = [adults, children, departure_flight_id]
        }
        const [updated] = await connection.query(query, arguments);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting updated error!');
    }
}

exports.cancelTicket = async (req, res) => {
    try {
        const ticket_id = req.params.ticket_id

        const [rows] = await connection.query(
            'UPDATE reservations set status = -1 where reservation_id = ?',
            [ticket_id]
        );

        const [reservation] = await connection.query(
            'SELECT * from reservations where reservation_id = ?',
            [ticket_id]
        );

        let query, arguments,
            departure_flight_id = reservation[0].departure_flight_id,
            return_flight_id = reservation[0].return_flight_id,
            adults = reservation[0].adults,
            children = reservation[0].children

        if (return_flight_id != null) {
            query = `UPDATE flights 
                    set adult_available = adult_available + ?,
                    child_available = child_available + ?
                    WHERE flight_id IN (?, ?)`
            arguments = [adults, children, departure_flight_id, return_flight_id]
        } else {
            query = `UPDATE flights 
                    set adult_available = adult_available + ?,
                    child_available = child_available + ?
                    WHERE flight_id = ?`
            arguments = [adults, children, departure_flight_id]
        }
        
        const [updated] = await connection.query(query, arguments);

        res.json(updated);
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
        if (channelId == visitorChannelId) {
            subscription_status = 0;
        } else {
            const [sub] = await connection.query(`
                SELECT * FROM subscribers WHERE channel_id_main = ? AND channel_id_subscriber = ?`,
                [channelId, visitorChannelId]);
            if (sub.length === 0) {
                subscription_status = -1;
            } else {
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
        res.json([{ ...rows[0], subscription_status }]);
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
