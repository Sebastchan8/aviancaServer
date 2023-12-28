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
            // const [rows] = await connection.query(
            //     `UPDATE reservations set status = 1 
            //     WHERE departure_flight_id IN (SELECT flight_id
            //                                 FROM flights
            //                                 WHERE departure_date <= ?)`,
            //     [new Date()]
            // );

            // const [reservations] = await connection.query(
            //     `SELECT 
            //         r.*, 
            //         df.departure_date AS departure_date
            //     FROM 
            //         reservations r
            //         JOIN flights df ON r.departure_flight_id = df.flight_id
            //     WHERE 
            //         r.user_id = ?`, 
            //     [user[0].user_id]
            // );

            // for(let i = 0; i < reservations.length; i++){
            //     if( (new Date() - new Date(reservations[i].departure_date) ) == 1 ){
            //         let notifications = await connection.query(
            //             `INSERT INTO notifications (user_id, icon, title, description)
            //             VALUES (?, 'alarm_outline', 'Reservation ID: ?', 'You have a pending flight on ?')
            //             `,
            //             [user[0].user_id, reservations[i].reservation_id, new Date(reservations[i].departure_date).toDateString()]
            //         );
            //     }
            // }

            const currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 1);

            const [rows] = await connection.query(
                `UPDATE reservations SET status = 1 
                WHERE departure_flight_id IN (
                    SELECT flight_id
                    FROM flights
                    WHERE departure_date <= ?)`,
                [currentDate]
            );


            const [reservations] = await connection.query(
                `SELECT 
                    r.*, 
                    df.departure_date AS departure_date
                FROM 
                    reservations r
                    JOIN flights df ON r.departure_flight_id = df.flight_id
                WHERE 
                    r.user_id = ?`,
                [user[0].user_id]
            );

            for (let i = 0; i < reservations.length; i++) {
                const departureDate = new Date(reservations[i].departure_date);
                const currentDate = new Date();

                const differenceInDays = Math.floor((departureDate - currentDate) / (1000 * 60 * 60 * 24));

                if (differenceInDays >= 0 && differenceInDays <= 2) {
                    const notification = await connection.query(
                        `INSERT INTO notifications (user_id, icon, title, description)
                    VALUES (?, 'alarm-outline', 'Reservation ID: ?', ?)`,
                        [user[0].user_id, reservations[i].reservation_id,
                        'You have a pending flight on ' + new Date(reservations[i].departure_date).toISOString().slice(0, 19).replace('T', ' ')]
                    );
                }
            }


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

        const [notification] = await connection.query(
            `INSERT INTO notifications values(?, 'airplane-outline', 'Welcome to Avianca!', 'Enjoy all about our flights that are unique for you!')`,
            [result.insertId]
        );
        return res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error registering the user' });
    }
};


//***********************FLIGHTS********************* */

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

exports.addFlight = async (req, res) => {
    try {
        const { aeroline_name, departure_city_id, destination_city_id, departure_date, destination_date,
            adult_price, child_price, adult_available, child_available } = req.body
        const [aeroline] = await connection.query(`
            SELECT aeroline_id from aerolines WHERE aeroline_name = ?`,
            [aeroline_name]);
        const [rows] = await connection.query(`
            INSERT INTO flights values(null, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [aeroline[0].aeroline_id, departure_city_id, destination_city_id, departure_date, destination_date,
                adult_price, child_price, adult_available, child_available]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.updateFlight = async (req, res) => {
    try {
        const { flight_id, aeroline_name, departure_city_id, destination_city_id, departure_date, destination_date,
            adult_price, child_price, adult_available, child_available } = req.body
        const [aeroline] = await connection.query(`
            SELECT aeroline_id from aerolines WHERE aeroline_name = ?`,
            [aeroline_name]);
        const [rows] = await connection.query(`
            UPDATE flights
            set aeroline_id = ?, departure_city_id = ?, destination_city_id = ?, departure_date = ?, destination_date = ?,
            adult_price = ?, child_price = ?, adult_available = ?, child_available = ?
            WHERE flight_id = ?`,
            [aeroline[0].aeroline_id, departure_city_id, destination_city_id, departure_date, destination_date,
                adult_price, child_price, adult_available, child_available, flight_id]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.deleteFlight = async (req, res) => {
    try {
        const flight_id = req.params.flight_id
        const [rows] = await connection.query(`
            DELETE FROM flights WHERE flight_id = ?`,
            [flight_id]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.addCity = async (req, res) => {
    try {
        const { city, country, continent, img } = req.body
        const [rows] = await connection.query(`
            INSERT INTO cities values(null, ?, ?, ?, ?)`, [city, country, continent, img]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.updateCity = async (req, res) => {
    try {
        const { id, city, country, continent, img } = req.body
        const [rows] = await connection.query(`
            UPDATE cities
            SET city = ?, country = ?, continent = ?, img = ?
            WHERE id = ?`,
            [city, country, continent, img, id]);
        res.json(rows);
    } catch (error) {
        console.log(error);
        res.status(500).send('Getting flights error!');
    }
}

exports.deleteCity = async (req, res) => {
    try {
        const city_id = req.params.city_id
        const [rows] = await connection.query(`
            DELETE FROM cities WHERE id = ?`,
            [city_id]);
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
                f.*,
                a.aeroline_name,
                a.aeroline_img,
                c1.city as departure_city,
                c2.city as destination_city
            FROM flights f, aerolines a, cities c1, cities c2
            WHERE f.aeroline_id = a.aeroline_id
            AND f.departure_city_id = c1.id
            AND f.destination_city_id = c2.id`);
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
                (f.departure_city_id = ?
                OR f.destination_city_id = ?)
                AND f.departure_date >= ?`
            arguments = [departure_id, destination_id, new Date()]
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
