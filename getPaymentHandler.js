const Redis = require('redis');

const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

const redisClient = Redis.createClient({
    socket: {
        host: redisHost,
        port: redisPort
    },
    tls: {},
    ssl: true,
});

redisClient.on('error', err => console.error('Error de conexión con ElastiCache:', err));

exports.getPaymentHandler = async () => {

    try {
        const payments = [];

        await redisClient.connect();

        const keys = await new Promise((resolve, reject) => {
            redisClient.keys("payments:*", (err, keys) => {
                if (err) {
                    console.error("Error retrieving keys from Redis:", err);
                    reject(err);
                    return;
                }
                resolve(keys);
            });
        });

        for (const key of keys) {
            const payment = await new Promise((resolve, reject) => {
                redisClient.json.get(key, (err, payment) => {
                    if (err) {
                        console.error("Error retrieving payment from Redis:", err);
                        reject(err);
                        return;
                    }
                    resolve(payment);
                });
            });
            payments.push(payment);
        }

        if (payments.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({error: 'No payments found'})
            };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(payments)
        };
    } catch (error) {
        console.error('Error retrieving payments:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Internal server error', errorDetails: error.message})
        };
    } finally {
        await redisClient.quit();
    }
};