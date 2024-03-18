//import express from "express"

//const express = require("express")
// const Redis = require("redis")
// const bodyParser = require("body-parser")
// const paymentRoute = require("./routes/payment")
// const fs = require("fs")
// const { addOrder, getOrder } = require("./services/orderService.js");
// const {addOrderItem, getOrderItem} = require("./services/orderItems")
// const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json", "utf8"));
// const Ajv = require("ajv")
// const ajv = new Ajv()
// const redisClient = Redis.createClient(
//     {url: `redis://localhost:6379`, legacyMode: true}
// );
// redisClient.on("connect", () => {
//     console.log("Connection to Redis")
// })
// const cors = require("cors")
// const options = {
//     origin: 'http://localhost:5173',
// }
//
// const app = express();
//
// const port = 3001;
//
//
// app.use(express.json())
//
// app.use(cors(options))
//
// app.use((req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Headers', 'privatekey, Origin, X-Requested-With, Content-Type, Accept');
//     next();
// });
//
// app.use(bodyParser.json());
//
// app.get("/boxes", async (req    , res, next) => {
//     let boxes = await redisClient.json.get('boxes', {
//         path: '$' //$ to get the whole object    $.name
//     })
//     res.json(boxes[0])
//     console.log(boxes)
// })
//
// //Orders Endpoints
// app.post("/orders", async (req,res) => {
//     let order = req.body;
//     //order details, include product quantity and shipping address
//     let responsestatus = order.productQuantity && order.ShippingAddress ? 200 : 400;
//
//     if (responsestatus === 200) {
//         try {
//             //addOrder function to handle order creation in the database
//             await addOrder({redisClient,order});
//             res.status(200).json({message: "Order created successfully", order:order});
//         } catch (error) {
//             console.error(error);
//             res.status(500).send("Internal Server Error");
//             return;
//         }
//     } else {
//         res.status(responsestatus);
//         res.send(
//             `Missing one of the following fields ${
//                 order.productQuantity ? "" : "productQuantity"
//             } ${order.ShippingAddress ? "" : "ShippingAddress"}`
//         );
//     }
//     res.status(responsestatus).send();
// });
//
// app.get("/orders/:orderId",async(req, res)=>{
//     //get the order from the database
//     const orderId = req.params.orderId;
//     let order = await getOrder({redisClient,orderId});
//     if (order === null) {
//         res.status(404).send("Order not found");
//     } else {
//         res.json(order);
//     }
// });
//
// //Order Items
// app.post("/orderItems", async(req, res)=>{
//     try {
//         console.log("Schema: ", Schema);
//         const validate = ajv.compile(Schema);
//         const valid = validate(req.body);
//         if(!valid){
//             return res.status(400).json({ error: "Invalid request body"});
//         }
//         console.log("Request body: ", req.body);
//
//         //Calling addOrderItem function and storing the result
//         const orderItemId = await addOrderItem({
//             redisClient,
//             orderItem:req.body,
//         });
//
//         //Responsing with the result
//         res
//             .status(201)
//             .json({orderItemId, message: "Order item added successfully"});
//     } catch (error) {
//         console.error("Error adding order item: ", error);
//         res.status(500).json({error:"Internal Server Error"});
//
//     }
// });
//
// app.get("/bestPlayers", async (req, res, next) => {
//     // let bestPlayers = await redisClient.json.get('bestPlayers',{
//     //     path: '$' //$ to get the whole object    $.name
//     // })
//
//     let bestPlayers = await redisClient.hGetAll("bestPlayers")
//     res.json({message: "Here they are"})
//
// })
//
//
// app.post("/bestPlayers", async (req, res, next) => {
//     // let bestPlayers = await redisClient.json.get('bestPlayers',{
//     //     path: '$' //$ to get the whole object    $.name
//     // })
//
//     const {name, country, club} = req.body;
//
//     const value = {
//         name, country, club
//     }
//     await redisClient.json.set("bestPlayers", "$", JSON.stringify(value))
//     let userSession = await redisClient.hGetAll('bestPlayers');
//     // res.json(bestPlayers[0])
//     res.json({message: "Successful, You are the best"})
// })
//
//
// app.post("/boxes", async (req, res) => {
//     const newBox = req.body;
//     newBox.id = await redisClient.json.arrLen('boxes', '$') + 1;
//     await redisClient.json.arrAppend('boxes', '$', {newBox})
//     res.json({message: "Box added successfully", newBox});
//     let boxes = await redisClient.json.get('boxes', {
//         path: '$' //$ to get the whole object    $.name
//     })
//     console.log("These are the updated boxes" + [JSON.stringify(boxes)])
// })
//
// app.get("/payments", async (req, res, next) => {
//     try {
//         const payments = [];
//
//         const keys = await new Promise((resolve, reject) => {
//             redisClient.keys("payments:*", (err, keys) => {
//                 if (err) {
//                     console.log("This is an error" + err);
//                     reject(err);
//                     return;
//                 }
//                 resolve(keys);
//             });
//         });
//
//         for (const key of keys) {
//             const payment = await redisClient.json.get(key);
//             payments.push(payment);
//         }
//         res.json(payments);
//     } catch (error) {
//         console.error('Error retrieving payments:', error);
//         res.status(500).json({error: 'Internal server error'});
//     }
//
// })
//
// app.get('/payments/:paymentId?', async (req, res) => {
//     try {
//
//         const {paymentId} = req.params;
//         const paymentKey = `payments:${paymentId}`;
//         const payment = await redisClient.json.get(paymentKey);
//         if (payment) {
//             res.json(payment);
//         } else {
//             res.status(404).json({error: 'Payment not found'});
//         }
//     } catch (error) {
//         console.error('Error from Redis:', error);
//         res.status(500).json({error: 'Error retrieving payments', message: error.message});
//     }
// });
//
//
// app.post("/payments", async (req, res, next) => {
//     try {
//         const {
//             customerId, billingAddress, billingCity,
//             billingState, billingZipCode, totalAmount, paymentId,
//             cardId, cardType, last4digits, orderId
//         } = req.body;
//
//         const payment = {
//             customerId, billingAddress, billingCity,
//             billingState, billingZipCode, totalAmount, paymentId,
//             cardId, cardType, last4digits, orderId
//         }
//
//         const paymentKey = `payments:${customerId}-${Date.now().toString()}`
//
//         await redisClient.json.set(paymentKey, '.', payment);
//
//         res.status(200).json({message: 'Payment successfully stored'});
//     } catch (error) {
//         console.error('Error storing:', error);
//         res.status(500).json({error: 'Internal server error'});
//     }
// })
//
//
// // app.use(paymentRoute)
// app.listen(port, () => {
//     redisClient.connect().then(r => {
//         console.log("It works")
//     });
//     console.log(`Listening on port ${port}`)
// })

const Redis = require('redis');
const {addOrder, getOrder} = require("./services/orderservice.js");
const {addOrderItem} = require("./services/orderItemservice.js");
const fs = require("fs");
const Schema = JSON.parse(fs.readFileSync("./orderItemSchema.json"));
const Ajv = require('ajv');
const ajv = new Ajv();

const redisClient = Redis.createClient({
    url:`redis://localhost:6379`
});

exports.boxesHandler = async (event, context) => {
    try {
        const boxes = await redisClient.json.get('boxes', { path: '$' });
        return {
            statusCode: 200,
            body: JSON.stringify(boxes[0])
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: "Internal Server Error"
        };
    }
};

exports.ordersHandler = async (event, context) => {
    try {
        const order = JSON.parse(event.body);
        let responseStatus = order.productQuantity
            ? 200
            : 400 && order.shippingAddress
                ? 200
                : 400;

        if (responseStatus === 200) {
            try {
                await addOrder({ redisClient, order });
            } catch (error) {
                console.error(error);
                return {
                    statusCode: 500,
                    body: "Internal Server Error"
                };
            }
        }

        return {
            statusCode: responseStatus,
            body: responseStatus === 200 ? "" : `Missing one of the following fields: ${exactMatchOrderFields()} ${partiallyMatchOrderFields()}`
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 400,
            body: "Invalid request body"
        };
    }
};

exports.orderItemsHandler = async (event, context) => {
    try {
        const validate = ajv.compile(Schema);
        const valid = validate(JSON.parse(event.body));
        if (!valid) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: "Invalid request body" })
            };
        }

        const orderItemId = await addOrderItem({ redisClient, orderItem: JSON.parse(event.body) });

        return {
            statusCode: 201,
            body: JSON.stringify({ orderItemId, message: "Order item added successfully" })
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: "Internal Server Error"
        };
    }
};

exports.ordersByIdHandler = async (event, context) => {
    try {
        const orderId = event.pathParameters.orderId;
        const order = await getOrder({ redisClient, orderId });

        return {
            statusCode: 200,
            body: JSON.stringify(order)
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: "Internal Server Error"
        };
    }
};

exports.paymentsHandler = async (event, context) => {
    try {
        const payments = [];

        const keys = await new Promise((resolve, reject) => {
            redisClient.keys("payments:*", (err, keys) => {
                if (err) {
                    console.log("This is an error" + err);
                    reject(err);
                    return;
                }
                resolve(keys);
            });
        });

        for (const key of keys) {
            const payment = await redisClient.json.get(key);
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
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

exports.paymentByIdHandler = async (event, context) => {
    try {
        const { paymentId } = event.pathParameters;
        const paymentKey = `payments:${paymentId}`;
        const payment = await redisClient.json.get(paymentKey);
        if (payment) {
            return {
                statusCode: 200,
                body: JSON.stringify(payment)
            };
        } else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Payment not found' })
            };
        }
    } catch (error) {
        console.error('Error from Redis:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error retrieving payment', message: error.message })
        };
    }
};

exports.postPaymentHandler = async (event, context) => {
    try {
        const {
            customerId, billingAddress, billingCity,
            billingState, billingZipCode, totalAmount, paymentId,
            cardId, cardType, last4digits, orderId
        } = JSON.parse(event.body);

        const payment = {
            customerId, billingAddress, billingCity,
            billingState, billingZipCode, totalAmount, paymentId,
            cardId, cardType, last4digits, orderId
        }

        const paymentKey = `payments:${customerId}-${Date.now().toString()}`

        await redisClient.json.set(paymentKey, '.', payment);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Payment successfully stored' })
        };
    } catch (error) {
        console.error('Error storing:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};