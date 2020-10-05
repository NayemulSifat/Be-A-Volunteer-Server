const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const bodyParser = require('body-parser');
const cors = require('cors');
const ObjectId = require('mongodb').ObjectId;
const admin = require("firebase-admin");
const serviceAccount = require("./config/beavolunteer-b3e03-firebase-adminsdk-a9fh9-b8081c0973.json");
require('dotenv').config()



const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kqm2a.mongodb.net/BeAVolunteer?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `${process.env.FIRE_DB}`
});




client.connect(err => {
  const collection = client.db(`${process.env.DB_NAME}`).collection("users");
  
  app.post('/addUser', (req, res) => {
    const newUser = req.body;
    collection.insertOne(newUser)
      .then(result => {
        res.send(result);
      })

  })

  app.get('/userEvents', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      console.log({ idToken })
      admin.auth().verifyIdToken(idToken)
        .then(function (decodedToken) {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          if (tokenEmail == queryEmail) {
            collection.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents)
              })
          }
          else{
            res.status(401).send('un-authorize access')
          }
        }).catch(function (error) {
          res.status(401).send('un-authorize access')
        });

    }

    else{
      res.status(401).send('un-authorize access')
    }

  })

  app.delete('/delete/:id', (req, res) => {
    collection.deleteOne({ _id: ObjectId(req.params.id)})
    .then( result => {
      res.send(result.deletedCount > 0);
    })

  })

});


app.listen(5000, () => {
  console.log('success')
})