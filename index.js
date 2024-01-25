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

// redisClient.on("error", ()=>{
//     console.log("Connection failed")
// })
const app = express();

const port = 3000;

// const boxes = [
//     // {boxId:1},
//     // {boxId:2},
//     // {boxId:3},
//     // {boxId:4},
// ]

app.use(bodyParser.json());


app.get("/", (req, res, next)=>{
    res.send("Hello World")
})
app.get("/boxes", async (req, res, next)=>{
    let boxes = await redisClient.json.get('boxes',{
        path: '$' //$ to get the whole object    $.name
    })
    res.send(JSON.stringify(boxes))
})

app.post("/boxes", async (req, res )=>{

        const newBox = req.body;
        newBox.id =  await redisClient.json.arrLen('boxes','$') +1;
        //newBox.id =  parseInt( await redisClient.json.arrLen('boxes','$')) +1;
        // await redisClient.json.set('boxes','$',newBox)
        await redisClient.json.arrAppend('boxes','$',[newBox])

        // let existingBoxes = await redisClient.json.get("boxes", { path: "$" }) || [];
        // console.log(existingBoxes)
        res.json({ message: "Box added successfully", newBox });
})



app.listen(port,()=>{
    redisClient.connect();
    console.log(`Listening on port ${port}`)
})


console.log("hello")