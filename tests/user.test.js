const request = require('supertest')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

const app = require('../src/app')
const User = require('../src/models/user')

const user1Id = new mongoose.Types.ObjectId()
const user1 = {
  _id: user1Id,
  name: 'Mike',
  email: 'mike@example.com',
  password: 'MyPass666!',
  tokens: [{
    token: jwt.sign({ _id: user1Id }, process.env.JWT_SECRET)
  }]
};

beforeEach(async () => {
  await User.deleteMany()

  await new User(user1).save()
})

test('Should signup a new user', async () => {
  const response = await request(app).post('/users').send({
    name: 'Andrew',
    email: 'andrew@example.com',
    password: 'MyPass777!'
  }).expect(201)

  const user = await User.findById(response.body.user._id)

  expect(user).not.toBeNull()
  expect(response.body).toMatchObject({
    user: {
      name: 'Andrew',
      email: 'andrew@example.com'
    },
    token: user.tokens[0].token
  })
  expect(user.password).not.toBe('MyPass777!')
})

test('Should login existing users', async () => {
  const response = await request(app).post('/users/login').send({
    email: user1.email,
    password: user1.password
  }).expect(200)

  const user = await User.findById(user1Id)

  expect(response.body.token).toBe(user.tokens[0].token)
})

test('Should not login nonexistent users', async () => {
  await request(app).post('/users/login').send({
    email: user1.email,
    password: 'thisisnotmypassword'
  }).expect(400)
})

test('Should get profile for users', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)
})

test('Should not get profile for unauthenticated users', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401)
})

test('Should delete accounts for users', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200)

  const user = await User.findById(user1Id)

  expect(user).toBeNull()
})

test('Should not delete accounts for unauthenticated users', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401)
})

test('Should upload avatars', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/penguin.png')
    .expect(200)

  const user = await User.findById(user1Id)

  expect(user.avatar).toEqual(expect.any(Buffer))
})

test('Should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send({
      name: 'Jess'
    })
    .expect(200)

  const user = await User.findById(user1Id)

  expect(user.name).toBe('Jess')
})

test('Should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${user1.tokens[0].token}`)
    .send({
      sex: 'female'
    })
    .expect(400)
})
