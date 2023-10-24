require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // Data Base Create:
    // Create Database and Collection:
    const userCollection = client.db("Dhaka_Bus_Ticket").collection("users");
    const ticketsCollection = client.db("Dhaka_Bus_Ticket").collection("users");
    const noticesCollection = client
      .db("Dhaka_Bus_Ticket")
      .collection("notices");

    app.post("/post_note", async (req, res) => {
      try {
        const body = req.body;
        const result = await noticesCollection.insertOne(body);
        res.send(result);
      } catch (error) {
        console.log(error);
      }
    });
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
