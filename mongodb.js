// Not needed in the app.
// Kept it here for references.

// const mongodb = require('mongodb');
// const MongoClient = mongodb.MongoClient;
// const ObjectID = mongodb.ObjectID;

const { MongoClient, ObjectID } = require('mongodb');

const connectionUrl = 'mongodb://127.0.0.1:27017';
const databaseName = 'task-manager';

// const id = new ObjectID();
//
// console.log(id.id); // The actual ID in binary
// console.log(id.id.length); // 12
// console.log(id.toHexString()); // The Hex representation
// console.log(id.toHexString().length); // 24
// console.log(id.getTimestamp());

MongoClient.connect(
  connectionUrl,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (error, client) => {
    if (error) {
      return console.log('Unable to connect to database!');
    }

    const db = client.db(databaseName);

    // db.collection('users').findOne(
    //   { _id: new ObjectID('5e9c51a945862b72970f5c9a') },
    //   (error, user) => {
    //     if (error) {
    //       return console.log(error);
    //     }
    //
    //     console.log(user);
    //   }
    // );

    db.collection('users').updateOne(
      { _id: new ObjectID('5e9c4cfc438600724044e385') },
      { $set: { name: 'April', age: 5 } }
    ).then(result => console.log(result)).catch(error => console.log(error));

    // db.collection('users').insertOne({
    //   _id: id,
    //   name: 'Xinyue',
    //   age: 32
    // }, (error, result) => {
    //   if (error) {
    //     return console.log('Unable to insert user!');
    //   }
    //
    //   console.log(result.ops);
    // });

    // db.collection('users').insertMany([
    //   { name: 'Jen', age: 28 },
    //   { name: 'Gunther', age: 27 }
    // ], (error, result) => {
    //   if (error) {
    //     return console.log('Unable to insert users!');
    //   }
    //
    //   console.log(result.insertedIds);
    // });
  }
);
