//import express from "express"

const express = require("express")
const app = express();

app.get("/", (req, res, next)=>{
    res.send("Hello World")
})

app.listen(4321,()=>{
    console.log("This is working")
})


console.log("hello")