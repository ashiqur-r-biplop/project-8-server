require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wapucld.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // Data Base Create:
        // Create Database and Collection:
        const userCollection = client.db('Dhaka_Bus_Ticket').collection('users');
        const ticketsCollection = client.db('Dhaka_Bus_Ticket').collection('tickets');
        const allBusCollection = client.db('Dhaka_Bus_Ticket').collection('allBusCollection');


        // Load All Bus Collection:
        app.get('/all-bus', async (req, res) => {
            const allBus = allBusCollection.find();
            const result = await allBus.toArray();
            res.send(result);
        });

        app.put('/book-ticket', async (req, res) => {
            const bookInformation = req.body;
            const busId = bookInformation.bus_id;
            const updatedBookedSeat = bookInformation.updateBookedSeat;
            const filter = { _id: new ObjectId(busId) };
            const options = { upsert: true };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: {
                    bookedSeat: updatedBookedSeat
                },
            };
            const result = await allBusCollection.updateOne(filter, updateDoc, options);
            res.json(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Dhaka Bus Ticket Server is Running!');
})

app.listen(port, (req, res) => {
    console.log(`Dhaka Bus Ticket Server Running on: ${port}`);
});