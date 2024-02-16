//import express from "express"

const express = require("express")
const Redis = require("redis")
const bodyParser = require("body-parser")
const paymentRoute = require("./routes/payment")


const redisClient = Redis.createClient(
    {url : `redis://localhost:6379`}
);
redisClient.on("connect", ()=>{
    console.log("Connection to Redis")
})
const cors = require("cors")
const options ={
    origin:'http://localhost:5173',
}

const app = express();

const port = 3001;


app.use(express.json())

app.use(cors(options))

app.use(bodyParser.json());

app.get("/", (req, res, next)=>{
    res.send("Hello World")
})

app.get("/boxes", async (req, res, next)=>{
    let boxes = await redisClient.json.get('boxes',{
        path: '$' //$ to get the whole object    $.name
    })
    res.json(boxes[0])
    console.log(boxes)
})

app.post("/boxes", async (req, res )=>{
        const newBox = req.body;
        newBox.id =  await redisClient.json.arrLen('boxes','$') +1;
        await redisClient.json.arrAppend('boxes','$',{newBox})
        res.json({ message: "Box added successfully", newBox });
    let boxes = await redisClient.json.get('boxes',{
        path: '$' //$ to get the whole object    $.name
    })
    console.log("These are the updated boxes"+ [JSON.stringify(boxes)])
})

app.get("/payments", async (req,res,next) =>{
    let payments = await redisClient.json.get('payments',{
        path: '$' //$ to get the whole object    $.name
    })
    res.json(payments[0])
    console.log(payments)

})

app.get('/payments/:customerId?', async (req, res) => {
    try {
        const { customerId } = req.params;

        if (customerId) {
            // Search for all payment keys that correspond to the provided customerId
            const paymentKey = await redisClient.keys('payment_*');
            const payments = [];

            for (const key of paymentKey) {
                const payment = await redisClient.json.get(key, { path: '.' });
                if (payment.customerId === customerId) {
                    payments.push(payment);
                }
            }

            if (payments.length > 0) {
                res.status(200).json(payments);
            } else {
                res.status(404).json({ error: 'No payments found for the given customer ID' });
            }
        } else {
            // No customerId provided, retrieve all payments
            const paymentKey = await redisClient.keys('payment_*');
            const allPayments = [];

            for (const key of paymentKey) {
                const payment = await redisClient.json.get(key, { path: '.' });
                allPayments.push(payment);
            }

            res.status(200).json(allPayments);
        }
    } catch (error) {
        console.error('Error retrieving payments from Redis:', error);
        res.status(500).json({ error: 'Error retrieving payments from Redis', details: error.message });
    }
});


app.post ("/payments",async (req,res,next) =>{
    try {
        const {
            customerId, billingAddress, billingCity,
            billingState, billingZipCode, totalAmount, paymentId,
            cardId, cardType, last4digits, orderId
        } = req.body;

        const payment = {
            customerId, billingAddress, billingCity,
            billingState, billingZipCode, totalAmount, paymentId,
            cardId, cardType, last4digits, orderId
        }

        const paymentKey = `payment:${Date.now().toString()}`

        await redisClient.json.set(paymentKey,':', payment);

        res.status(200).json({message: 'Payment successfully stored in Redis'});
    } catch (error) {
        console.error('Error storing payment in Redis:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
})




// app.use(paymentRoute)
app.listen(port,()=>{
    redisClient.connect().then(r => {
        console.log("It works")
    });
    console.log(`Listening on port ${port}`)
})