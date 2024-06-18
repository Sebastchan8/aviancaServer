const transporter = require('./mailer_config')
const connection = require('../config/db');
const cron = require('node-cron');

exports.scheduleMailNotification = (crontab) => {
    cron.schedule(crontab, async () => {
        let msg = null;
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let hour = 0;
        let minute = 0;

        const data = await getNotificationInfo();

        await data.forEach(async (reservation) => {
            hour = reservation.DEPARTURE_DATE.getHours();
            minute = reservation.DEPARTURE_DATE.getMinutes();
            msg = await transporter.sendMail({
                from: '"Traveler Trip Enterprise" <cptravelertrip@gmail.com>', // sender address
                to: reservation.EMAIL, // list of receivers
                subject: "Recordatorio de Vuelo Próximo",
                html: 
                    `<div style="font-size: 1.2rem;">
                        <div style="margin-bottom: 30px;">
                            Saludos, <b>${reservation.LASTNAME} ${reservation.FIRSTNAME}</b>.<br>
                        </div>
                        <div style="margin-bottom: 30px;">
                            Este es un recordaotrio de que el día <b>${reservation.DEPARTURE_DATE.toLocaleDateString("es-ES", dateOptions)}</b>
                            a las <b>${hour}:${minute}</b>, <br>
                            partirá su vuelo de la aerolínea <b>${reservation.AEROLINE_NAME}</b> <img src="${reservation.AEROLINE_IMG}" height="50" alt="Aeroline Image"> <br>
                            reservado con destino a <b>${reservation.CITY}, ${reservation.COUNTRY}</b> para ${reservation.ADULTS} adulto(s)
                            ${reservation.CHILDREN > 0 ? ` y ${reservation.CHILDREN} niño(s)` : ''}.<br>
                        </div>
                        <div style="margin-bottom: 30px;">
                            Por favor, <b>acercarse</b> al menos con <b>una hora de anticipación</b> al aeropuerto acordado. <br>
                            Le deseamos lo mejor en su viaje.<br>
                        </div>
                    </div>
                    <div style="color: rgba(0,0,0,0.5); font-style: italic" center>
                        Este es un mensaje generado de forma automática, porfavor no responder
                    </div>`
            });
        });
        console.log("Correos Enviados Exitosamente!");
    });
    console.log('Envio Automático de Emails programado');
}

async function getNotificationInfo(){
    try {
        const [data] = await connection.query(
            `SELECT users.FIRSTNAME, users.LASTNAME, users.EMAIL,
            cities.CITY, cities.COUNTRY,
            aerolines.AEROLINE_NAME, aerolines.AEROLINE_IMG,
            flights.DEPARTURE_DATE,
            reservations.ADULTS, reservations.CHILDREN
            FROM RESERVATIONS AS reservations, 
            FLIGHTS AS flights,
            USERS AS users,
            CITIES AS cities,
            AEROLINES AS aerolines
            WHERE reservations.user_id = users.user_id
            AND cities.id = flights.destination_city_id
            AND aerolines.AEROLINE_ID = flights.AEROLINE_ID
            AND (reservations.departure_flight_id = flights.flight_id
            OR reservations.return_flight_id = flights.flight_id) 
            AND DATEDIFF(flights.departure_date, CURDATE()) = 1`
        );

        return data

    } catch (error) {
        console.error("Error al intentar ejecutar getNotificationInfo() en mail_scheduler.js",error);
    }
}