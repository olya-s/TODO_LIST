const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 4000;
const cors = require('cors');
const bodyParser = require('body-parser');
const expressJwt = require('express-jwt');
const jwt = require('jsonwebtoken');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

const config = {
  secret: `;dtn',kznm`,
  algorithms: ['HS256']
}

function jwtWare() {
  const { secret } = config;
  return expressJwt(config).unless({
    path: [
      '/authenticate',
      '/',
      '/style.css',
      '/script.js'
    ]
  });
}

function errorHandler(err, req, res, next) {
  if (typeof (err) === 'string') {
    return res.status(400).json({ message: err });
  }
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ message: 'Invalid Token' });
  }
  return res.status(500).json({ message: err.message });
}

async function authenticate({ username, password }) {
  const user = await User.findOne({ where: { username, password } });
  if (user) {
    const token = jwt.sign({ sub: user.id }, config.secret);
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      token
    };
  }
  else {
    console.log("not found");
  }
}

// api routes
app.post('/authenticate', function (req, res, next) {
  authenticate(req.body)
    .then(user => user ? res.json(user) : res.status(400).json({ message: 'Username or password is incorrect' }))
    .catch(err => next(err));
});

app.use(jwtWare());

app.use(errorHandler);
app.use(express.json());
app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/', (req, res, next) => {
  res.sendFile(path.resolve(__dirname, 'client', 'index.html'));
  next();
})

//GET
app.get('/todo/:id', async (req, res) => {
  const todos = await getTodos(req.params.id);
  if (todos) {
    const tasks = [];
    for (let i = 0; i < todos.length; i++) {
      tasks.push(...await getTasks(todos[i].id));
    }
    if (tasks) {
      res.send({ todos, tasks });
    }
    else {
      res.send(todos);
    }
  }
  else {
    res.status(400).send({ message: "Todos not found" });
  }
});

//POST
app.post('/todo/:userId', async (req, res) => {
  const todo = await Todo.create({ userId: req.params.userId, ...req.body });
  res.status(201).json(todo);
});
app.post('/task/:todoId', async (req, res) => {
  let max = await Task.max('ordinal', { where: { todoId: req.params.todoId } });
  const task = await Task.create({ ordinal: max + 1, todoId: req.params.todoId, ...req.body });
  res.status(201).json(task);
});

//DELETE
app.delete('/todo/:id', async (req, res) => {
  const task = await Task.destroy({ where: { todoId: req.params.id } });
  const todo = await Todo.destroy({ where: { id: req.params.id } });
  res.status(200).json({ message: 'success' });
});
app.delete('/task/:id', async (req, res) => {
  const task = await Task.destroy({ where: { id: req.params.id } });
  res.status(200).json({ message: 'success' });
});

//PUT
app.put('/todo/:id', async (req, res) => {
  const todo = await Todo.update({ title: req.body.title }, { where: { id: req.params.id } });
  res.status(200).json({ message: "success" });
});
app.put('/task/:id', async (req, res) => {
  const task = await Task.update({
    text: req.body.text,
    marked: Number(req.body.marked),
    ordinal: req.body.ordinal
  },
    { where: { id: req.params.id } });
  res.status(200).json({ message: "success" });
});

async function getTodos(id) {
  const todos = await Todo.findAll({ where: { userId: id } });
  return todos;
}

async function getTasks(id) {
  const tasks = await Task.findAll({ where: { todoId: id } });
  return tasks;
}

// ------------------	Sequelize

const Sequelize = require('sequelize');
const sequelize = new Sequelize('mysql://b14946aa18a19e:ea04b13e@us-cdbr-east-02.cleardb.com/heroku_0782ec50ad5f364', { query: { raw: true } });

try {
  sequelize.authenticate()
    .then(() => console.log('Connection has been established successfully.'));
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

class User extends Sequelize.Model { }

User.init({
  username: Sequelize.STRING,
  password: Sequelize.STRING
}, { sequelize, modelName: 'user' });

class Todo extends Sequelize.Model {
  get tasks() {
    const tasks = getTasks();
    return tasks;
  }
}

Todo.init({
  title: Sequelize.STRING
}, { sequelize, modelName: 'todo' });

class Task extends Sequelize.Model { }

Task.init({
  text: Sequelize.TEXT,
  marked: Sequelize.TINYINT,
  ordinal: Sequelize.INTEGER,
  date: Sequelize.STRING
}, { sequelize, modelName: 'task' });

User.hasMany(Todo);
Todo.belongsTo(User);
Todo.hasMany(Task);
Task.belongsTo(Todo);

; (async () => {
  await sequelize.sync();
  let user1 = await User.create({ username: 'user1', password: 'passw1' });
  let user2 = await User.create({ username: 'user2', password: 'passw2' });
})();

app.listen(port, () => { console.log(`Server has been started on port ${port}...`) });