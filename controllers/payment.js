const {redisClient} = require("../index");

exports.getPayment = async (req,res,next) =>{
    let payments = await redisClient.json.get('payment',{
        path: '$' //$ to get the whole object    $.name
    })
    res.json(payments[0])
    console.log(payments)

}

exports.postPayment = async (req,res,next) =>{
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
}