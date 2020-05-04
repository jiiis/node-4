const express = require('express')
const multer = require('multer')
const sharp = require('sharp')

const auth = require('../middleware/auth')
const User = require('../models/user')
const { sendCancellationEmail, sendWelcomeEmail } = require('../emails/account')

const router = new express.Router()

// Don't wanna expose the info of other users
// router.get('/users', auth, async (req, res) => {
//   try {
//     const users = await User.find({})
//
//     res.send(users)
//   } catch (error) {
//     res.status(500).send()
//   }
// })

// Don't wanna expose the info of other users
// router.get('/users/:id', async (req, res) => {
//   try {
//     const user = await User.findById(req.params.id)
//
//     if (!user) {
//       return res.status(404).send()
//     }
//
//     res.send(user)
//   } catch (error) {
//     res.status(500).send()
//   }
// })

// Disallow deleting other users
// router.delete('/users/:id', async (req, res) => {
//   try {
//     const user = await User.findByIdAndDelete(req.params.id)
//
//     if (!user) {
//       return res.status(404).send()
//     }
//
//     res.send(user)
//   } catch (error) {
//     res.status(500).send()
//   }
// })

// Disallow updating other users
// router.patch('/users/:id', async (req, res) => {
//   const updateKeys = Object.keys(req.body)
//   const updateKeysAllowed = ['name', 'email', 'password', 'age']
//   const areUpdateKeysValid = updateKeys.every(updateKey => updateKeysAllowed.includes(updateKey))
//
//   if (!areUpdateKeysValid) {
//     return res.status(400).send({ error: 'Invalid update keys!' })
//   }
//
//   try {
//     // "findByIdAndUpdate" bypasses Mongoose. Instead, it deals directly with MongoDB.
//     // This is why we need to explicitly pass runValidators.
//     // This also means that we are not able to take advantage of Mongoose middleware with this "findByIdAndUpdate".
//     // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
//
//     // The following code solves the issue above.
//     const user = await User.findById(req.params.id)
//
//     updateKeys.forEach((updateKey) => user[updateKey] = req.body[updateKey])
//
//     await user.save()
//
//     if (!user) {
//       return res.status(404).send()
//     }
//
//     res.send(user)
//   } catch (error) {
//     res.status(400).send()
//   }
// })

// Sign up
router.post('/users', async (req, res) => {
  const user = new User(req.body)

  try {
    await user.save()

    sendWelcomeEmail(user.email, user.name)

    const token = await user.generateAuthToken()

    res.status(201).send({ user, token })
  } catch (error) {
    res.status(400).send(error)
  }
})

router.post('/users/login', async (req, res) => {
  try {
    const user = await User.findByCredentials(req.body.email, req.body.password)
    const token = await user.generateAuthToken()

    res.send({ user, token })
  } catch (error) {
    res.status(400).send()
  }
})

router.post('/users/logout', auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)

    await req.user.save()

    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

router.post('/users/logoutAll', auth, async (req, res) => {
  try {
    req.user.tokens = []

    await req.user.save()

    res.send()
  } catch (error) {
    res.status(500).send()
  }
})

router.get('/users/me', auth, async (req, res) => {
  res.send(req.user)
})

router.patch('/users/me', auth, async (req, res) => {
  const updateKeys = Object.keys(req.body)
  const updateKeysAllowed = ['name', 'email', 'password', 'age']
  const areUpdateKeysValid = updateKeys.every(updateKey => updateKeysAllowed.includes(updateKey))

  if (!areUpdateKeysValid) {
    return res.status(400).send({ error: 'Invalid update keys!' })
  }

  try {
    updateKeys.forEach((updateKey) => req.user[updateKey] = req.body[updateKey])

    await req.user.save()

    res.send(req.user)
  } catch (error) {
    res.status(400).send()
  }
})

router.delete('/users/me', auth, async (req, res) => {
  try {
    await req.user.remove()

    sendCancellationEmail(req.user.email, req.user.name)

    res.send(req.user)
  } catch (error) {
    res.status(500).send()
  }
})

const upload = multer({
  limits: {
    fileSize: 1000000
  },
  fileFilter (req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Please upload an image.'))
    }

    cb(undefined, true)
  }
})

router.get('/users/:id/avatar', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user || !user.avatar) {
      throw new Error()
    }

    res.set('Content-Type', 'image/png').send(user.avatar)
  } catch (error) {
    res.status(404).send()
  }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
  req.user.avatar = await sharp(req.file.buffer).resize({ height: 240 }).png().toBuffer()

  await req.user.save()

  res.send()
}, (error, req, res, next) => {
  res.status(400).send({ error: error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
  req.user.avatar = undefined

  await req.user.save()

  res.send()
})

module.exports = router
