const amqplib = require("amqplib");



(async () => {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();

    const exchangeName = "log"
    const logLevel = "error"

    ch.assertExchange(exchangeName, 'direct', {
        durable: false
    });

    const qObj = await ch.assertQueue("", { exclusive: true })

    ch.bindQueue(qObj.queue, exchangeName, logLevel)


    console.log(" [x] Waiting for logs. To exit press CTRL+C")

    ch.consume(qObj.queue, (msg) => {
        console.log(`sms:${msg.fields.routingKey}:${Date.now()}:${msg.content.toString()}`);
    })

})()