const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/payment")


router.get("/payment", paymentController.getPayment)