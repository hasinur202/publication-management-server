const express = require('express');
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjlge.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('car_bazar');
        const productsCollection = database.collection('products');
        const usersCollection = database.collection('users');
        const OrdersCollection = database.collection('orders');
        
        const bookingCollection = database.collection('bookings');

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // Add Product API
        app.post('/addproduct', async (req, res) => {
            const product = req.body;
            product.rating = 0;
            product.count = 0;
            const result = await productsCollection.insertOne(product);
            res.json(result);
        })

        // GET API
        app.get('/products', async (req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        // DELETE Product
        app.delete('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await productsCollection.deleteOne(query);
            res.json(result);
        })

        // GET Single product
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productsCollection.findOne(query);
            res.json(product);
        })

        // Add Order API
        app.post('/orders', async (req, res) => {
            const orders = req.body;
            const result = await OrdersCollection.insertOne(orders);
            res.json(result);
        })

        // GET Orders all
        app.get('/all-orders', async (req, res) => {
            const orders = await OrdersCollection.find({});
            const ordered = await orders.toArray();
            res.json(ordered);
        })

        //Approve API
        app.put('/approve-order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 1
                },
            };
            const result = await OrdersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        // DELETE order API
        app.delete('/order/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await OrdersCollection.deleteOne(query);
            res.json(result);
        })

        //Reject order API
        app.put('/reject-order/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 3
                },
            };
            const result = await OrdersCollection.updateOne(filter, updateDoc, options)
            res.json(result)
        })

        // GET order by email
        app.get('/orders/:email', async (req, res) => {
            const uid = req.params.email;
            const query = { email: uid };
            const booking = await OrdersCollection.find(query);
            const booktours = await booking.toArray();
            res.json(booktours);
        })

        app.put('/add-admin', async (req, res) => {
            const user = req.body;

            const requesterAccount = await usersCollection.findOne({ email: user.email });
            if (requesterAccount) {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'admin' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.json(result);
            } else {
                res.status(403).json({ message: 'User not exist..' })
            }
        })

        //UPDATE API
        // app.put('/users/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const updatedUser = req.body;
        //     const filter = { _id: ObjectId(id) };
        //     const options = { upsert: true };
        //     const updateDoc = {
        //         $set: {
        //             name: updatedUser.name,
        //             email: updatedUser.email
        //         },
        //     };
        //     const result = await usersCollection.updateOne(filter, updateDoc, options)
        //     console.log('updating', id)
        //     res.json(result)
        // })

    }

    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Running Bongo Car Bazar Server');
});

app.listen(port, () => {
    console.log('Running Bongo Car Bazar Server on Port', port);
})