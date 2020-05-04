const express = require('express')

const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

// router.get('/tasks', auth, async (req, res) => {
//   try {
//     // Approach 1
//     // const tasks = await Task.find({ owner: req.user._id })
//
//     // res.send(tasks)
//
//     // Approach 2
//     await req.user.populate('tasks').execPopulate()
//
//     res.send(req.user.tasks)
//   } catch (error) {
//     res.status(500).send()
//   }
// })

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
  const completed = req.query.completed
  const sortBy = req.query.sortBy
  const match = {}
  const sort = {}

  if (completed) {
    match.completed = completed === 'true'
  }

  if (sortBy) {
    const parts = sortBy.split(':')
    sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
  }

  try {
    await req.user.populate({
      path: 'tasks',
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort
      }
    }).execPopulate()

    res.send(req.user.tasks)
  } catch (error) {
    res.status(500).send()
  }
})

router.get('/tasks/:id', auth, async (req, res) => {
  try {
    // const task = await Task.findById(req.params.id)
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }

    res.send(task)
  } catch (error) {
    res.status(500).send()
  }
})

router.post('/tasks', auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  })

  try {
    task.save()

    res.status(201).send(task)
  } catch (error) {
    res.status(400).send(error)
  }
})

router.patch('/tasks/:id', auth, async (req, res) => {
  const updateKeys = Object.keys(req.body)
  const updateKeysAllowed = ['description', 'completed']
  const areUpdateKeysValid = updateKeys.every(updateKey => updateKeysAllowed.includes(updateKey))

  if (!areUpdateKeysValid) {
    return res.status(400).send({ error: 'Invalid update keys!' })
  }

  try {
    // "findByIdAndUpdate" bypasses Mongoose. Instead, it deals directly with MongoDB.
    // This is why we need to explicitly pass runValidators.
    // This also means that we are not able to take advantage of Mongoose middleware with this "findByIdAndUpdate".
    // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    // The following code solves the issue above.
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }

    updateKeys.forEach((updateKey) => task[updateKey] = req.body[updateKey])

    await task.save()

    res.send(task)
  } catch (error) {
    console.log(1111, error)
    res.status(400).send()
  }
})

router.delete('/tasks/:id', auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

    if (!task) {
      return res.status(404).send()
    }

    res.send(task)
  } catch (error) {
    res.status(500).send()
  }
})

module.exports = router
