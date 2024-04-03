const Redis = require('redis');

const redisClient = Redis.createClient({
    url: `redis://${process.env.REDIS_HOST}:6379`
});

exports.getPaymentHandler = async () => {
    await redisClient.connect();
    try {
        const payments = [];

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
        return {
            statusCode: 200,
            body: JSON.stringify(payments)
        };
    } catch (error) {
        console.error('Error retrieving payments:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({error: 'Internal server error'})
        };
    }
};