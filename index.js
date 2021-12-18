const express = require('express');
const cors = require('cors');
require("dotenv").config();
const {MongoClient} = require('mongodb');

const app = express();
const port = process.env.PORT || 5000;
const ObjectID = require('mongodb').ObjectId;

//midelware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5cmdn.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});




async function run() {
    try {
        await client.connect();
        const database = client.db("blood-donner-ctg");
        const usersCollection = database.collection("users");
        const donnersCollection = database.collection("donners");
        const bloodRequestCollection = database.collection("request-blood");

        app.get("/dashboard", async (req, res) => {
            const donnerCursor = donnersCollection.find({});
            const donner = await donnerCursor.count();
            const bloodCursour = bloodRequestCollection.find({});
            const bloodCount = await bloodCursour.count();
            const userCursor = usersCollection.find({});
            const userCount = await userCursor.count();
            res.send({ donner, bloodCount, userCount });
        });


        // //Updata Order status

        app.get("/requestbloodlist", async (req, res) => {
            const cursor = bloodRequestCollection.find({}).sort({ _id: -1 });
            const reqblist = await cursor.toArray();
            res.json(reqblist);
        });

        app.get("/requestbloodlistNotice", async (req, res) => {
            const query = {'status':"pending"}
            const cursor = bloodRequestCollection.find(query).sort({ _id: -1 });
            const reqblist = await cursor.toArray();
            res.json(reqblist);
        });



        app.put("/bloodRequeststatus/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const data = req.body;
            const updateDoc = {
                $set: {
                    status: data.status,
                },
            };
            console.log(data);
            const order = await bloodRequestCollection.updateOne(query, updateDoc);
            res.json(order);
        });



        app.get("/requestDonnerReglist", async (req, res) => {
            const cursor = donnersCollection.find({}).sort({ _id: -1 });
            const reqblist = await cursor.toArray();
            res.json(reqblist);
        });

        app.get('/donnerList',async (req,res)=>{
            const query = { 'status':'accepted'}
            const cursour = donnersCollection.find(query).sort({ _id: -1 });
            const result = await cursour.toArray();
            res.json(result);
        })

        app.delete("/donner/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await donnersCollection.deleteOne(query);
            res.send(result);
        });
        app.delete("/bloodRequest/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bloodRequestCollection.deleteOne(query);
            res.send(result);
        });


        app.put("/bloodDonnerRegStatus/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectID(id) };
            const data = req.body;
            const updateDoc = {
                $set: {
                    status: data.status,
                },
            };
            console.log(data);
            const order = await donnersCollection.updateOne(query, updateDoc);
            res.json(order);
        });
        //Request Blood

        app.post('/requestBlood',async (req,res)=>{
            const requestBlood = req.body;
            const result = await bloodRequestCollection.insertOne(requestBlood);
            console.log(result);
            res.json(result);
        })

        //Get User

        app.get("/users/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };

            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === "admin") {
                isAdmin = true;
            }

            res.json({ admin: isAdmin });
        });

        app.post("/users", async (req, res) => {
            const user = req.body;
            user.role = "user";
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });



        app.put("/users", async (req, res) => {
            console.log(req.body);
            const user = req.body;
            const requester = user.email;
            const requesterAccount = await usersCollection.findOne({
                email: requester,
            });
            if (!requesterAccount) {
                user.role = "user";
            }
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(
                filter,
                updateDoc,
                options
            );
            res.json(result);
        });



        app.put("/users/admin", async (req, res) => {
            const user = req.body;
            const requester = user.adminMail;
            console.log(requester);
            if (requester) {
                const requesterAccount = await usersCollection.findOne({
                    email: requester,
                });
                if (requesterAccount.role === "admin") {
                    const filter = { email: user.email };
                    const updateDoc = { $set: { role: "admin" } };
                    const result = await usersCollection.updateOne(
                        filter,
                        updateDoc
                    );
                    res.json(result);
                }
            } else {
                res.status(403).json({
                    message: "you do not have access to make admin",
                });
            }
        });


        app.post("/donnerRegister", async (req, res) => {
            const donner = req.body;
            const result = await donnersCollection.insertOne(donner);
            console.log(result);
            res.json(result);
        });

        app.get("/donnerRegister/:email", async (req, res) => {
            const email = req.params.email;
            console.log(email);
            const query = { email: email };

            const user = await donnersCollection.findOne(query);
            let isRequest = false;
            if (user?.role !== "donner") {
                isRequest = true;
            }

            res.json({ request: isRequest,status:user.status,role:user.role });
        });

        app.post("/requestBlood", async (req, res) => {
            const bloodRequest = req.body;
            const result = await bloodRequestCollection.insertOne(bloodRequest);
            console.log(result);
            res.json(result);
        });

    } finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Hello Dooner!");
});

app.listen(port, () => {
    console.log(`listening at ${port}`);
});