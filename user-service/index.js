const amqplib = require("amqplib");

(async () => {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();

    const queueName = 'user_rpc';

    ch.assertQueue(queueName, {
        durable: false
    });

    console.log(' [x] awaiting for request');

    ch.consume(queueName, (msg) => {
        console.log("received message for finding user: ", msg.content.toString());
        const result = userValidation(msg.content.toString())

        ch.sendToQueue(msg.properties.replyTo, Buffer.from(result.toString()), {
            correlationId: msg.properties.correlationId
        })

        ch.ack(msg)

    }
    )
})()


let user = [{ username: 'Ashkan' }, { username: 'Asghar' }, { username: 'Abbas' }]

function userValidation(name) {
    name = new RegExp(`${name}`, "i");
    const uIsValid = user.find(element => element.username.match(name))
    return uIsValid ? true : false
}
