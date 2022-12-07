const amqplib = require("amqplib");

const argsArr = process.argv.slice(2)

let arg = process.argv.slice(2)[0];
arg = arg ? arg : 'list';

if (arg === 'list') {
    bike(argsArr[1] ? argsArr[1] : 'list')
} else if (arg === 'rent') {
    rent(argsArr[1] ? argsArr[1] : 'null', argsArr[2] ? argsArr[2] : 'null')
} else if (arg === 'back') {
    back(argsArr[1])
} else if (arg === 'user') {
    //call creatw user
} else {
    console.log("write in correct pattern");
}

async function bike(type) {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();
    const correlationId = generateUuid()
    const queueName = 'bike_rpc';
    const qReply = await ch.assertQueue("", { exclusive: true })

    // console.log(' [x] Requesting fib(%d)', n);
    console.log(`Requesting list of bicycles(${type})`);

    ch.consume(qReply.queue, (msg) => {
        if (msg.properties.correlationId === correlationId) {
            console.log("bike ", type, "= ", msg.content.toString());
            setTimeout(() => {
                connection.close()
                process.exit(0)
            })
        }

    },
        { noAck: true }
    )

    ch.sendToQueue(queueName, Buffer.from(type.toString()), {
        correlationId,
        replyTo: qReply.queue
    })

}

async function rent(user, bike) {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();
    const userCorrelationId = generateUuid()
    const bikeCorrelationId = generateUuid()
    const userQReply = await ch.assertQueue("", { exclusive: true })
    const bikeQReply = await ch.assertQueue("", { exclusive: true })

    console.log(`${user} request to rent ${bike} bicycles`);

    await ch.consume(userQReply.queue, async (msg) => {
        if (msg.properties.correlationId === userCorrelationId) {
            console.log("user ", user, "= ", msg.content.toString());
            if (msg.content.toString() == 'true') {
                await ch.consume(bikeQReply.queue, (msg) => {
                    if (msg.properties.correlationId === bikeCorrelationId) {
                        console.log("bike ", bike, "= ", msg.content.toString());
                        console.log('msg.content.toString():', msg.content.toString());
                        setTimeout(() => {
                            connection.close()
                            process.exit(0)
                        })
                    }
                }, { noAck: true })
                // ch.sendToQueue('bike_rpc', Buffer.from(bike.toString()), {
                ch.sendToQueue('bike_rpc', Buffer.from([bike, user].toString()), {
                    correlationId: bikeCorrelationId,
                    replyTo: bikeQReply.queue
                })
            } else {
                console.log("this user  not exist");
            }

            setTimeout(() => {
                connection.close()
                process.exit(0)
            })
        }

    },
        { noAck: true }
    )

    ch.sendToQueue('user_rpc', Buffer.from(user.toString()), {
        correlationId: userCorrelationId,
        replyTo: userQReply.queue
    })

}

async function back(bike) {
    const connection = await amqplib.connect("amqp://localhost:5672")
    const ch = await connection.createChannel();
    const correlationId = generateUuid()
    const queueName = 'bike_rpc';
    const qReply = await ch.assertQueue("", { exclusive: true })

    // console.log(' [x] Requesting fib(%d)', n);
    console.log(`Return back bicycle(${bike})`);

    ch.consume(qReply.queue, (msg) => {
        if (msg.properties.correlationId === correlationId) {
            console.log("bike ", bike, "= ", msg.content.toString());
            setTimeout(() => {
                connection.close()
                process.exit(0)
            })
        }

    },
        { noAck: true }
    )

    ch.sendToQueue(queueName, Buffer.from(bike.toString()), {
        correlationId,
        replyTo: qReply.queue
    })
}

function generateUuid() {
    return Math.random().toString() +
        Math.random().toString() +
        Math.random().toString();
}