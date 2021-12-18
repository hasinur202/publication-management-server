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
        const database = client.db('publication_management');
        const contentAreaCollection = database.collection('content_areas');
        const contentsCollection = database.collection('contents');
        const usersCollection = database.collection('users');

        const productsCollection = database.collection('products');
        const OrdersCollection = database.collection('orders');

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

        app.get('/editor-users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isEditor = false;
            if (user?.role === 'editor') {
                isEditor = true;
            }
            res.json({ editor: isEditor });
        })

        // GET users API
        app.get('/users', async (req, res) => {
            const cursor = usersCollection.find({});
            const contents = await cursor.toArray();
            res.send(contents);
        });

        // GET dashboard
        app.get('/dashboard', async (req, res) => {
            const user = usersCollection.find({});
            const contentArea = contentAreaCollection.find({});
            const contents = contentsCollection.find({});
            const orders = OrdersCollection.find({});

            const users = await user.toArray();
            const contentAreas = await contentArea.toArray();
            const contentss = await contents.toArray();
            const orderss = await orders.toArray();
            
            let newdata = {}
            newdata.totalUser = users.length
            newdata.contentArea = contentAreas.length
            newdata.contentCount = contentss.length
            newdata.orderCount = orderss.length

            res.send(newdata);
        });

// ==============================================

        // Add Content API
        app.post('/add-content-area', async (req, res) => {
            const content = req.body;
            const result = await contentAreaCollection.insertOne(content);
            res.json(result);
        })

        // GET content areas API
        app.get('/content-areas', async (req, res) => {
            const cursor = contentAreaCollection.find({});
            const contents = await cursor.toArray();
            res.send(contents);
        });

        // GET Single product
        app.get('/content-area-details/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await contentAreaCollection.findOne(query);
            res.json(product);
        })

        // update status areas
        app.put('/content-areas/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await contentAreaCollection.findOne(filter);
            let status = '';
            status = result.status === 1 ? 2 : 1;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: status
                },
            };
            const newResult = await contentAreaCollection.updateOne(filter, updateDoc, options)
            res.json(newResult);
        })

        // add admin
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
        // add editor
        app.put('/add-editor', async (req, res) => {
            const user = req.body;
            const requesterAccount = await usersCollection.findOne({ email: user.email });
            if (requesterAccount) {
                const filter = { email: user.email };
                const updateDoc = { $set: { role: 'editor' } };
                const result = await usersCollection.updateOne(filter, updateDoc);
                res.json(result);
            } else {
                res.status(403).json({ message: 'User not exist..' })
            }
        })

        // GET contents
        app.get('/contents', async (req, res) => {
            const cursor = contentsCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });
        // Add Contents API
        app.post('/contents', async (req, res) => {
            const product = req.body;
            product.price = 0;
            const result = await contentsCollection.insertOne(product);
            res.json(result);
        })

        // GET contents by email
        app.get('/contents/:email', async (req, res) => {
            const uid = req.params.email;
            const query = { email: uid };
            const content = await contentsCollection.find(query);
            const contents = await content.toArray();
            res.json(contents);
        })

        // DELETE contents API
        app.delete('/contents/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await contentsCollection.deleteOne(query);
            res.json(result);
        })

        // reject contents
        app.put('/contents-reject/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            let status = 3;
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: status
                },
            };
            const newResult = await contentsCollection.updateOne(filter, updateDoc, options)
            res.json(newResult);
        })
        // recommended contents
        app.put('/contents-recommend/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 2
                },
            };
            const newResult = await contentsCollection.updateOne(filter, updateDoc, options)
            res.json(newResult);
        })

        // approve contents
        app.put('/contents-approve/:id/:price', async (req, res) => {
            const id = req.params.id;
            const price = req.params.price;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 1,
                    price: price
                },
            };
            const newResult = await contentsCollection.updateOne(filter, updateDoc, options)
            res.json(newResult);
        })

        // GET approved contents API
        app.get('/get-approved-conents', async (req, res) => {
            const query = { status: 1 };
            const cursor = await contentsCollection.find(query);
            const contents = await cursor.toArray();
            res.json(contents);
        });

        // GET Single Contents
        app.get('/contents-by-id/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await contentsCollection.findOne(query);
            res.json(product);
        })
// ========================================

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
    res.send('Publication Management Server');
});

app.listen(port, () => {
    console.log('Publication Management Server on Port', port);
})