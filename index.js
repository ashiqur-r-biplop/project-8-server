require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const SSLCommerzPayment = require("sslcommerz-lts");
const crypto = require("crypto").randomBytes(64).toString("hex");
// console.log(crypto);

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { CLIENT_RENEG_LIMIT } = require("tls");
// middleware
app.use(cors());
app.use(express.json());
const username = process.env.DB_USER;
const password = process.env.DB_PASS;
const store_id = process.env.Store_ID;
const store_passwd = process.env.Store_Password;
const is_live = false;
const uri = `mongodb+srv://${username}:${password}@cluster0.wapucld.mongodb.net/?retryWrites=true&w=majority`;

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
  console.log(authorization, 31);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access2" });
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
    const usersOrderCollection = client.db("Dhaka_Bus_Ticket").collection("order");
    const feedbackCollection = client.db("Dhaka_Bus_Ticket").collection("allFeedback");
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
    const newsLetterSubscriber = client.
      db("Dhaka_Bus_Ticket")
      .collection("subscriber");
    const bookBusCollection = client
      .db("Dhaka_Bus_Ticket")
      .collection("BookBusCollection");
    const contactCollection = client
      .db("Dhaka_Bus_Ticket")
      .collection("contactCollection");

    // jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      // console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });
    // admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      // console.log(email);
      const query = { email: email };
      // console.log(query);
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };
//user billing info route


// user billing info route
app.get('/user-bills',async(req,res)=>{
  try {
    const result = await usersOrderCollection.find().toArray();
    res.status(200).send({
      message:true,
      bills:result
    })
  } catch (error) {
    console.log(error);
  }
})

 // subscriber 
  app.post("/subscriber",async(req,res)=>{
    const email = req.body;
    try {
     const result =  await newsLetterSubscriber.insertOne(email)
     res.send(result);
    } catch (error) {
      console.log(error);
    }
  })
  // get subsciber count 

  app.get("/subscriberCount",async(req,res)=>{
 
    try {
      result = await newsLetterSubscriber.countDocuments();
      // console.log(result);
      res.status(200).send({
        success: true,
        count: result,
      });
    } catch (error) {
      console.log(error);
    }
  })

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
          return res.status(400).json({ error: "Email parameter is missing" });
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
          return res.status(404).json({ error: "User not found with this id" });
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

    app.post('/contact-form', async (req, res) => {
      const contactDetails = req.body;
      const result = await contactCollection.insertOne(contactDetails);
      res.send(result);
    })

    app.get('/contact', async (req, res) => {
      const contact = await contactCollection.find().toArray();
      res.send(contact);
    })

    // Book Bus API:
    app.post('/book-bus', async (req, res) => {
      const bookBus = req.body;
      const result = await bookBusCollection.insertOne(bookBus);
      res.send(result);
    })

    app.post("/post-note", async (req, res) => {
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
    app.get("/admin/:email", async (req, res) => {
      try {
        const email = req.params.email;
        console.log(email, 290);
        const filter = { email: email };
        console.log(filter, 290);
        const result = await userCollection.findOne(filter);
        console.log(result, 290);
        res.send({ role: result?.role });
      } catch (error) {
        console.log(error);
      }
    });
    // payment
    app.post("/order", async (req, res) => {
      const tran_id = new ObjectId().toString();
      const order = req.body;
      console.log(order);

      const data = {
        total_amount: order.price,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: "https://dhaka-bus-ticket-server-two.vercel.app/success",
        fail_url: "https://dhaka-bus-ticket-server-two.vercel.app/failure",
        cancel_url: "https://dhaka-bus-ticket-server-two.vercel.app/cancel",
        ipn_url: "https://dhaka-bus-ticket-server-two.vercel.app/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: "Customer Name",
        cus_email: order.email,
        cus_add1: "Dhaka",
        cus_add2: "Dhaka",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "1000",
        cus_country: "Bangladesh",
        cus_phone: "01711111111",
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };
      // console.log(data)
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });
        const finalOrder = {
          transitionId: tran_id,
          customerEmail: order.email,
        };
        const result = usersOrderCollection.insertOne(finalOrder);
      });
    });
    app.post("/success", async (req, res) => {
      const result = await usersOrderCollection.updateOne(
        { tran_id: req.body.tran_id },
        {
          $set: {
            val_id: req.body.val_id,
          },
        }
      );
      res.redirect(`https://deft-paletas-f3d1fd.netlify.app/`);
    });

    app.post("/failure", async (req, res) => {
      const result = await usersOrderCollection.deleteOne({
        tran_id: req.body.tran_id,
      });

      res.redirect(`https://deft-paletas-f3d1fd.netlify.app/`);
    });

    app.post("/cancel", async (req, res) => {
      const result = await usersOrderCollection.deleteOne({
        tran_id: req.body.tran_id,
      });
      res.redirect(`https://deft-paletas-f3d1fd.netlify.app/`);
    });

    app.post("/ipn", (req, res) => {
      console.log(req.body);
      res.send(req.body);
    });

    app.post("/validate", async (req, res) => {
      const result = await usersOrderCollection.findOne({
        tran_id: req.body.tran_id,
      });
      if (result.val_id === req.body.val_id) {
        const update = await usersOrderCollection.updateOne(
          { tran_id: req.body.tran_id },
          {
            $set: {
              paymentStatus: "payment Complete",
            },
          }
        );
        console.log(update);
        res.send(update.modifiedCount > 0);
      } else {
        res.send("Chor detected");
      }
    });

    app.get("/orders/:tran_id", async (req, res) => {
      const id = req.params.tran_id;
      const result = await usersOrderCollection.findOne({ tran_id: id });
      res.json(result);
    });
    // payment
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