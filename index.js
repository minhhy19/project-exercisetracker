const moment = require('moment');
const mongoose = require('mongoose');
const UserModel = require('./models/User.model');
const ExerciseModel = require('./models/Exercise.model');
const bodyParser = require('body-parser');
const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());
app.use(cors())
app.use(express.json());
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async function(req, res) {
  try {
    const username = req.body.username;
    let created = await UserModel.create({ username });
    res.json({
      _id: created._id,
      username: created.username
    });
  } catch (error) {
    console.error(error)
    res.status(500).json('Server erorr...')
  }
});

app.get('/api/users', async function(req, res) {
  try {
    let listUser = await UserModel.find();
    res.json(listUser);
  } catch (error) {
    console.error(error)
    res.status(500).json('Server erorr...')
  }
});

app.post('/api/users/:_id/exercises', async function(req, res) {
  try {
    const { description, duration, date } = req.body;
    const userId = req.params._id;
    let user = await UserModel.findOne({ _id: userId });
    let createExercise = await ExerciseModel.create({
      userId,
      description,
      duration,
      date: date ? date : new Date()
    })
    res.json({
      _id: userId,
      username: user.username,
      ...(createExercise.date && { date: createExercise.date.toDateString() }),
      duration: createExercise.duration,
      description: createExercise.description
    });
  } catch (error) {
    console.error(error)
    res.status(500).json('Server erorr...')
  }
});

app.get('/api/users/:_id/logs', async function(req, res) {
  try {
    const { from, to, limit } = req.query;
    const userId = req.params._id;
    let user = await UserModel.findOne({ _id: userId });
    let filter = {
      userId
    };
    if (from || to) {
      filter.date = {
        ...(from && { $gte: from }),
        ...(to && { $lte: to })
      }
    }
    
    let exercises;
    if (limit) {
      exercises = await ExerciseModel.find(filter).limit(limit).sort({date: -1});
    } else {
      exercises = await ExerciseModel.find(filter).sort({date: -1});
    }
    let log = exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      ...(ex.date && { date: ex.date.toDateString() })
    }))
    
    res.json({
      _id: userId,
      username: user.username,
      ...(from && { from: (new Date(from)).toDateString() }),
      ...(to && { to: (new Date(to)).toDateString() }),
      count: log.length,
      log
    });
  } catch (error) {
    console.error(error)
    res.status(500).json('Server erorr...')
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
