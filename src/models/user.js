const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const Task = require('./task')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    validate (email) {
      if (!validator.isEmail(email)) {
        throw new Error('Email is invalid.')
      }
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 7,
    trim: true,
    validate (password) {
      if (password.toLowerCase().includes('password')) {
        throw new Error('Password cannot contain "password".')
      }
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    default: 0,
    validate (age) {
      if (age < 0) {
        throw new Error('Age must be a positive number.')
      }
    }
  },
  avatar: {
    type: Buffer
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
})

// Backward reference
userSchema.virtual('tasks', {
  ref: 'Task',
  localField: '_id', // Task references User's _id.
  foreignField: 'owner' // Task references User by "owner"
})

userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email })

  if (!user) {
    throw new Error('Unable to login!')
  }

  const doesMatch = await bcrypt.compare(password, user.password)

  if (!doesMatch) {
    throw new Error('Unable to login!')
  }

  return user
}

userSchema.methods.generateAuthToken = async function() {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

  user.tokens = user.tokens.concat({ token })

  await user.save()

  return token;
}

// Exclude private info every time we read a user.
userSchema.methods.toJSON = function() {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.avatar
  delete userObject.tokens

  return userObject
}

userSchema.pre('save', async function (next) {
  const user = this

  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

userSchema.pre('remove', async function(next) {
  const user = this

  await Task.deleteMany({ owner: user._id })

  next()
})

const User = mongoose.model('User', userSchema)

module.exports = User
