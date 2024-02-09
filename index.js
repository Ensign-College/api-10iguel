//import express from "express"

const express = require("express")
const Redis = require("redis")
const bodyParser = require("body-parser")
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

app.listen(port,()=>{
    redisClient.connect().then(r => {
        console.log("It works")
    });
    console.log(`Listening on port ${port}`)
})