const express = require('express')

require('./db/mongoose')

const userRouter = require('./routers/user')
const taskRouter = require('./routers/task')

const app = express()

// Middleware register.
// Has to be before other "app.use" expressions.
// app.use((req, res, next) => {
//   if (req.method === 'GET') {
//     res.status(400).send()
//   } else {
//     next()
//   }
// })

// Site maintenance.
// app.use((req, res, next) => {
//   res.status(503).send('Site is under maintenance. Check back soon!')
// })

// Auto-parse request body.
app.use(express.json())

app.use(userRouter)
app.use(taskRouter)

module.exports = app

// const User = require('./models/user')
// const Task = require('./models/task')
//
// const main = async () => {
//   // Get user by task.
//   const task = await Task.findById('some task ID')
//
//   await task.populate('owner').execPopulate()
//
//   console.log(task.owner)
//
//   // Get task by user
//   const user = await User.findById('some user ID')
//
//   await user.populate('tasks').execPopulate()
//
//   console.log(user.tasks)
// }
//
// main()
