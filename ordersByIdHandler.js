

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