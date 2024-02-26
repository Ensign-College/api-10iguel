//import express from "express"

const express = require("express")
const Redis = require("redis")
const bodyParser = require("body-parser")
const paymentRoute = require("./routes/payment")
const fs = require("fs")
// const Schema = JSON.parse(fs.readFileSync("./orderItemSchema", "utf-8"))
const Ajv = require("ajv")
const ajv = new Ajv()
const redisClient = Redis.createClient(
    {url: `redis://localhost:6379`, legacyMode: true}
);
redisClient.on("connect", () => {
    console.log("Connection to Redis")
})
const cors = require("cors")
const options = {
    origin: 'http://localhost:5173',
}

const app = express();

const port = 3001;


app.use(express.json())

app.use(cors(options))

app.use(bodyParser.json());

app.get("/", async (req, res, next) => {
    res.send("Hello World")
})

app.get("/boxes", async (req, res, next) => {
    let boxes = await redisClient.json.get('boxes', {
        path: '$' //$ to get the whole object    $.name
    })
    res.json(boxes[0])
    console.log(boxes)
})

//Orders

app.post("/orders", async (req, res, next) => {
    let order = req.body;
    let responseStatus = order.productQuantity ? 200 : 400 && order.ShippingAddress ? 200 : 400;
    if (responseStatus === 200) {
        try {
            //await addOrder({redisClient, order})
        } catch (error) {
            res.status(500).send("Internal Server Error")
            return;
        }
    } else {
        res.status(responseStatus)
        // res.send(`
        // missing one of the fields: ${exactMatchFields()} ${partiallyMatchOrderFields}`)
    }

})


app.get("/bestPlayers", async (req, res, next) => {
    // let bestPlayers = await redisClient.json.get('bestPlayers',{
    //     path: '$' //$ to get the whole object    $.name
    // })

    let bestPlayers = await redisClient.hGetAll("bestPlayers")
    res.json({message: "Here they are"})

})


app.post("/bestPlayers", async (req, res, next) => {
    // let bestPlayers = await redisClient.json.get('bestPlayers',{
    //     path: '$' //$ to get the whole object    $.name
    // })

    const {name, country, club} = req.body;

    const value = {
        name, country, club
    }
    await redisClient.json.set("bestPlayers", "$", JSON.stringify(value))
    let userSession = await redisClient.hGetAll('bestPlayers');
    // res.json(bestPlayers[0])
    res.json({message: "Successful, You are the best"})
})


app.post("/boxes", async (req, res) => {
    const newBox = req.body;
    newBox.id = await redisClient.json.arrLen('boxes', '$') + 1;
    await redisClient.json.arrAppend('boxes', '$', {newBox})
    res.json({message: "Box added successfully", newBox});
    let boxes = await redisClient.json.get('boxes', {
        path: '$' //$ to get the whole object    $.name
    })
    console.log("These are the updated boxes" + [JSON.stringify(boxes)])
})

app.get("/payments", async (req, res, next) => {
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
        res.json(payments);
    } catch (error) {
        console.error('Error retrieving payments:', error);
        res.status(500).json({error: 'Internal server error'});
    }

})

app.get('/payments/:customerId?', async (req, res) => {
    try {

        const {customerId} = req.params;
        const paymentKey = `payments:${customerId}`;
        const payment = await redisClient.json.get(paymentKey);
        if (payment) {
            res.json(payment);
        } else {
            res.status(404).json({error: 'Payment not found'});
        }
    } catch (error) {
        console.error('Error from Redis:', error);
        res.status(500).json({error: 'Error retrieving payments', message: error.message});
    }
});


app.post("/payments", async (req, res, next) => {
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

        const paymentKey = `payments:${Date.now().toString()}`

        await redisClient.json.set(paymentKey, '.', payment);

        res.status(200).json({message: 'Payment successfully stored'});
    } catch (error) {
        console.error('Error storing:', error);
        res.status(500).json({error: 'Internal server error'});
    }
})


// app.use(paymentRoute)
app.listen(port, () => {
    redisClient.connect().then(r => {
        console.log("It works")
    });
    console.log(`Listening on port ${port}`)
})