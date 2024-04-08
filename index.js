const Redis = require('redis');
const { addOrder, getOrder } = require("./services/orderService.js");
const { addOrderItem, getOrderItem } = require("./services/orderItems");
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json", "utf8"));
const Ajv = require("ajv");
const ajv = new Ajv();
// const redisClient = Redis.createClient({
//     url: `redis://${process.env.REDIS_HOST}:6379`
// });

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

redisClient.on('error', err => console.error('Error de coneccion con ElastiCache:', err));



// Function to handle POST requests for adding boxes
exports.addBoxHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);
        const newBox = requestBody;
        newBox.id = parseInt(await redisClient.json.arrLen('boxes', '$')) + 1;

        await redisClient.json.arrAppend('boxes', '$', newBox);

        return {
            statusCode: 200,
            body: JSON.stringify(newBox)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Function to handle GET requests for boxes
exports.getBoxesHandler = async (event, context) => {
    try {
        let boxes = await redisClient.json.get('boxes', { path: '$' });
        return {
            statusCode: 200,
            body: JSON.stringify(boxes[0])
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Function to handle POST requests for sending payments
exports.sendPaymentHandler = async (event, context) => {
    await redisClient.connect();
    try {
        // Parse the request body data
        const { customerId, billingAddress, billingCity, billingState, billingZipCode, totalAmount, paymentId, cardId, cardType, last4digits, orderId } = JSON.parse(event.body);

        // Create payment object
        const payment = {
            customerId, billingAddress, billingCity, billingState, billingZipCode, totalAmount, paymentId, cardId, cardType, last4digits, orderId
        };

        // Generate the key for storing in Redis
        const paymentKey = `payments:${customerId}-${Date.now().toString()}`;

        // Store payment in Redis
        await redisClient.json.set(paymentKey, '.', payment);

        // Respond with success
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment successfully stored' })
        };
    } catch (error) {
        // Handle errors
        console.error('Error storing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Function to handle GET requests for payment by ID
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

// Function to handle GET requests for payments per customer
exports.getPaymentsPerCustomerHandler = async (event, context) => {
    try {
        const customerId = event.pathParameters.customerId;

        if (customerId) {
            // Search for all payment keys that correspond to the provided customerId
            const paymentKeys = await redisClient.keys(`payment_${customerId}_*`);
            const payments = [];

            for (const key of paymentKeys) {
                const payment = await redisClient.json.get(key, { path: '.' });
                payments.push(payment);
            }

            if (payments.length > 0) {
                return {
                    statusCode: 200,
                    body: JSON.stringify(payments)
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ error: 'No payments found for the given customer ID' })
                };
            }
        } else {
            // No customerId provided, retrieve all payments
            const paymentKeys = await redisClient.keys('payment_*');
            const allPayments = [];

            for (const key of paymentKeys) {
                const payment = await redisClient.json.get(key, { path: '.' });
                allPayments.push(payment);
            }

            return {
                statusCode: 200,
                body: JSON.stringify(allPayments)
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error retrieving payments from Redis', details: error.message })
        };
    }
};

// Function to handle POST requests for orders
exports.addOrderHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);
        const order = requestBody;

        // Check if required fields are present
        if (!order.productQuantity || !order.ShippingAddress) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing productQuantity or ShippingAddress' })
            };
        }

        // Add order to the database
        await addOrder({ redisClient, order });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Order created successfully', order: order })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Function to handle GET requests for orders by ID
exports.getOrderHandler = async (event, context) => {
    try {
        const orderId = event.pathParameters.orderId;

        // Retrieve order from the database
        const order = await getOrder({ redisClient, orderId });

        if (order) {
            return {
                statusCode: 200,
                body: JSON.stringify(order)
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Order not found' })
            };
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

// Function to handle POST requests for order items
exports.addOrderItemHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);
        const validate = ajv.compile(Schema);
        const valid = validate(requestBody);
        if (!valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request body" })
            };
        }

        // Add order item to the database
        const orderItemId = await addOrderItem({
            redisClient,
            orderItem: requestBody,
        });

        return {
            statusCode: 201,
            body: JSON.stringify({ orderItemId, message: "Order item added successfully" })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Internal Server Error" })
        };
    }
};

// Don't forget to close Redis connection after usage
const closeRedisConnection = () => {
    redisClient.quit();
};