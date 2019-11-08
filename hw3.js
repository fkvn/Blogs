'use strict'

const mongodb = require('mongodb')
const mongoClient = mongodb.MongoClient
const url = 'mongodb://cs5220stu21:CAORqZiMyUls@ecst-csproj2.calstatela.edu:6317/cs5220stu21'
const readlineSync = require('readline-sync');
const clear = require('clear');

const getUsers = (db) => {
    return new Promise((resolve, reject) => {
        db.collection('users').find({}).toArray((err, docs) => {
            if (err) reject(err);
            resolve(docs);
        })
    })
}

const getUser = (db, id) => {
    var users = db.collection('users')
    return new Promise((resolve, reject) => {
        users.findOne({ "_id": mongodb.ObjectID(id) }, (err, urs) => {
            if (err) reject(err);
            resolve(urs);
        })
    })
}

const getArticlesByUserId = (db, user_id) => {
    var articles = db.collection('articles')
    return new Promise((resolve, reject) => {
        articles.find({"author": mongodb.ObjectID(user_id)},{projection:{_id: 0, 'title':1}}).toArray((err, artcs) => {
            if (err) reject(err);
            resolve(artcs)
        })
    })
}

var  mainScreen = (db) => {
    return new Promise(async (resolve, reject) => {
        clear();

        console.log('\nMain Menu\n')

        var users = await getUsers(db);

        for (let i in users) {
            console.log(`${Number(i) + 1}) ${users[i].firstName} ${users[i].lastName}`)
        }
        console.log('x) Exit')

        var choice = readlineSync.question('\nPlease enter your choice: ');

        if (choice === 'x')
            resolve({
                url: "exit"
            });
        
        if (Number(choice) > 0 && Number(choice) <= users.length) {
            var user = await getUser(db, users[Number(choice) - 1]._id)

            resolve({
                url: "userScreen",
                user: user
            });
        }
        
    })
}

var userScreen = (db, user) => {
    return new Promise(async (resolve, reject) => {
        clear();

        console.log(`\nUser - ${user.firstName} ${user.lastName}`);

        console.log(`\n1) List the articles authored by the user\n2) Change first name\n3) Change last name\n4) Change email\nb) Back to Main Menu`);

        var choice = readlineSync.question('\nPlease enter your choice: ');

        if (choice === 'b')
        {
            resolve({
                url: "mainMenu"
            })
        }

        if (choice === '1') {
            resolve({
                url: "userArticleScreen",
                user: user
            })
        }

        if (choice === '2' || choice  === '3' || choice === '4') {
            resolve({
                url: "updateUserScreen",
                user: user,
                field: choice === '2' ? 'first name': choice === '3' ? 'last name': 'email'
            })
        }
        else 
            resolve({url: "exit"})
    })
}

var userArticleScreen = (db, user) => {
    return new Promise(async (resolve, reject) => {
        clear();

        console.log(`\nUser - ${user.firstName} ${user.lastName}`);

        console.log(`\nList the articles authored by the user\n`);

        var articles = await getArticlesByUserId(db, user._id)

        for (let i in articles) {
            console.log(`* Article ${Number(i) + 1}: ${articles[i].title}`)
        }
        
        console.log('\nb) Back to User page')

        var choice = readlineSync.question('\nPlease enter your choice: ');

        if (choice === 'b')
        {
            resolve({
                url: "userScreen",
                user: user
            })
        }
        else 
            resolve({url: "exit"})
    })
}

var updateUserScreen = (db, user, field) => {
    return new Promise(async (resolve, reject) => {
        clear();
        var newValue = readlineSync.question(`\nPlease enter a new value of ${field}: `);

        if (field === 'first name') {
            await db.collection('users').updateOne({"_id": mongodb.ObjectID(user._id)}, {$set: {firstName: newValue}});
        }
        else if (field === 'last name') {
            await db.collection('users').updateOne({"_id": mongodb.ObjectID(user._id)}, {$set: {lastName: newValue}});
        }
        else if (field === 'email') {
            await db.collection('users').updateOne({"_id": mongodb.ObjectID(user._id)}, {$set: {email: newValue}});
        }

        user = await getUser(db, user._id)

        resolve({
            url: "userScreen",
            user: user
        })
    })
}

async function hw3 (db) {
    let returnUrl
    try {
        returnUrl = await mainScreen(db)

        while (returnUrl.url !== 'exit') {

            if (returnUrl.url === 'mainMenu')
                returnUrl = await mainScreen(db)

            else if (returnUrl.url === 'userScreen') {
                returnUrl = await userScreen(db, returnUrl.user)
            }

            else if (returnUrl.url === 'userArticleScreen') {
                returnUrl = await userArticleScreen(db, returnUrl.user)
            }

            else if (returnUrl.url === 'updateUserScreen') {
                console.log("Hello")
                returnUrl = await updateUserScreen(db, returnUrl.user, returnUrl.field)
            }

        }

        process.exit(1)

    } catch(e) {}
}


mongoClient.connect(url, { useUnifiedTopology: true }, (error, client) => {
    if (error) console.error(error)
    var db = client.db('cs5220stu21')
    hw3(db)

})