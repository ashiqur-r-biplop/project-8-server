const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

const crypto = require("crypto").randomBytes(64).toString("hex");
// console.log(crypto);

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
    },
});

const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).json({ error: true, message: "Unauthorized access" });
    }

    const token = authorization.split(" ")[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: true, message: "Unauthorized access" });
        }
        req.decoded = decoded;
        next();
    });
};

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        // Data Base Create:
        // Create Database and Collection:
        const userCollection = client.db("Dhaka_Bus_Ticket").collection("users");
        const ticketsCollection = client
            .db("Dhaka_Bus_Ticket")
            .collection("tickets");
        const allBusCollection = client
            .db("Dhaka_Bus_Ticket")
            .collection("allBusCollection");
        const noticesCollection = client
            .db("Dhaka_Bus_Ticket")
            .collection("notices");
        const testingAllBus = client
            .db("Dhaka_Bus_Ticket")
            .collection("testing-all-bus");
        const bookBusCollection = client
            .db("Dhaka_Bus_Ticket")
            .collection("book_bus_collection");

        // jwt
        app.post("/jwt", (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: "24h",
            });
            res.send({ token });
        });

        // Load All User:
        app.get("/users", async (req, res) => {
            const allUsers = userCollection.find();
            const result = await allUsers.toArray();
            res.send(result);
        });
        // Load a single User
        app.get("/single-user", async (req, res) => {
            const email = req.query.email;
            console.log(email);

            try {
                const query = { email: email };

                if (!email) {
                    return res
                        .status(400)
                        .json({ error: "Email parameter is missing" });
                }
                const result = await userCollection.findOne(query);
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        });
        // single-user-update(arif)
        app.patch("/single-user/:userId", async (req, res) => {
            const Id = req.params.userId;
            const user = req.body;
            console.log(user, Id);

            try {
                const filter = { _id: new ObjectId(Id) };
                const existingUser = await userCollection.findOne(filter);

                if (!existingUser) {
                    // User not found
                    return res
                        .status(404)
                        .json({ error: "User not found with this id" });
                }
                const options = { upsert: true };
                const updatedUser = {
                    $set: {
                        name: user.name,
                        number: user.number,
                    },
                };
                console.log(updatedUser);
                const result = await userCollection.updateOne(
                    filter,
                    updatedUser,
                    options
                );

                res.send(result);
            } catch (error) {
                // Server error
                console.log({
                    message: "Dog Shit",
                    error,
                });
                res.status(500).json({ error: "Server error" });
            }
        });

        // Get current login user by email
        app.get("/getUserByEmail/:email", async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const result = await userCollection.findOne(query);
            res.send(result);
        });

        // Post Users:
        app.post("/users", async (req, res) => {
            const newUser = req.body;
            console.log(newUser);
            const result = await userCollection.insertOne(newUser);
            console.log(result);
            res.send(result);
        });

        // Post a bus:
        app.post("/post-bus", async (req, res) => {
            const newBus = req.body;
            console.log(`"New bus post is: " ${newBus}`);
            const result = await testingAllBus.insertOne(newBus);
            res.send(result);
        });

        // Load All Bus Collection:
        app.get("/all-bus", async (req, res) => {
            const allBus = allBusCollection.find();
            const result = await allBus.toArray();
            res.send(result);
        });
        // Booked Seat in Bus:
        app.put("/book-ticket", async (req, res) => {
            const bookInformation = req.body;
            const busId = bookInformation.bus_id;
            const updatedBookedSeat = bookInformation.updateBookedSeat;
            const filter = { _id: new ObjectId(busId) };
            const options = { upsert: true };
            // create a document that sets the plot of the movie
            const updateDoc = {
                $set: {
                    bookedSeat: updatedBookedSeat,
                },
            };
            const result = await allBusCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });

        // User Book Ticket Post:
        app.post("/book-my-ticket", async (req, res) => {
            const bookMyTicket = req.body;
            const result = await ticketsCollection.insertOne(bookMyTicket);
            res.send(result);
        });

        // Get All Tickets:
        app.get("/all-ticket", async (req, res) => {
            const getAllTicket = await ticketsCollection.find().toArray();
            res.send(getAllTicket);
        });

        // Get My Ticket:
        app.get("/my-ticket/:email", async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const result = await ticketsCollection.find(filter).toArray();
            res.send(result);
        });

        app.post("/post-note", async (req, res) => {
            try {
                const body = req.body;
                const result = await noticesCollection.insertOne(body);
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        });

        // ******************Book Bus*******************
        app.post('/book-bus', async (req, res) => {
            const bookBusInformation = req.body;
            const result = await bookBusCollection.insertOne(bookBusInformation);
            res.send(result);
        })
        app.get("/notices", async (req, res) => {
            try {
                const allNotes = await noticesCollection.find().toArray();
                res.send(allNotes);
            } catch (error) {
                console.log(error);
            }
        });
        app.delete("/delete-notice/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const query = { _id: new ObjectId(id) };
                const result = await noticesCollection.deleteOne(query);
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        });
        app.patch("/update-notice/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const body = req.body;
                const query = { _id: new ObjectId(id) };
                const option = { upsert: true };
                const updateNotice = {
                    $set: {
                        notice: body?.notice,
                        createNoteDate: body?.createNoteDate,
                        updateNoticeDate: body?.updateNoticeDate,
                    },
                };
                const result = await noticesCollection.updateOne(
                    query,
                    updateNotice,
                    option
                );
                res.send(result);
            } catch (error) {
                console.log(error);
            }
        });
        // get all feedback
        app.get("/all-feedback", async (req, res) => {
            try {
                const response = await feedbackCollection.find().toArray();
                console.log(response);
                res.status(200).send({
                    result: response,
                });
            } catch (error) {
                console.log(error);
            }
        });
        // user-feedback posting
        app.post("/user-feedback", async (req, res) => {
            const feedbackInfo = req.body;
            // console.log(feedbackInfo)
            try {
                const response = await feedbackCollection.insertOne(feedbackInfo);
                res.send({ result: response });
            } catch (error) {
                console.log(error);
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });

        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Dhaka Bus Ticket Server is Running!");
});

app.listen(port, (req, res) => {
    console.log(`Dhaka Bus Ticket Server Running on: ${port}`);
});