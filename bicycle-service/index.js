const amqplib = require("amqplib");

(async () => {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();

    const queueName = 'bike_rpc';

    ch.assertQueue(queueName, {
        durable: false
    });

    console.log(' [x] awaiting for request');

    ch.consume(queueName, (msg) => {
        console.log("received message for finding: ", msg.content.toString());

        const result = bikeList(msg.content.toString())

        ch.sendToQueue(msg.properties.replyTo, Buffer.from(result.toString()), {
            correlationId: msg.properties.correlationId
        })

        ch.ack(msg)

    }
    )
})()

const bikes = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
const rentedBikes = [{ "b1": 'Ashkan' }, { "b2": 'Asghar' }];

function bikeList(type) {
    if (type.includes(',')) {
        type = type.split(',')
        user = type[1]
        type = type[0]

        if (!rentedBikes.find(a => a.hasOwnProperty(type)) && type !== 'null') {
            rentedBikes.push({ [type]: user });
            console.log(`you succesfully rent ${type} bicycle`);
            return `you succesfully rent ${type} bicycle`
        } else {
            console.log('this bicycle is rented, please choose anotherone');
            return 'this bicycle is rented, please choose anotherone'
        }
    }

    const unkown = rentedBikes.find(a => a.hasOwnProperty(type))
    if (unkown) {
        rentedBikes.splice(rentedBikes.indexOf(unkown), 1)
        return "It's returned! calc time & money"
    }
    return type === 'rented' ? JSON.stringify(rentedBikes) : type === 'list' ? bikes : "what the hell"
}
