/**
 * Database Operation
 */

import * as mongoose from 'mongoose'
import { sha256 } from './util'

mongoose.connect('mongodb://localhost/pt_dashboard', {
  useNewUrlParser: true,
  connectTimeoutMS: 3000
})

// 用户表
const userSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  createdAt: { type: Date, default: Date.now },
  lastAccessAt: { type: Date, default: Date.now }
})
export interface IUser extends mongoose.Document {
  name: string
  password: string
  createdAt: Date
  lastAccessAt: Date
}
const User = mongoose.model<IUser>('User', userSchema, 'user')

/** 创建用户 */
export async function createUser(name: string, pass: string) {
  const password = sha256(pass)
  const user = new User({ name, password })
  try {
    const res = await user.save()
    return res
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      const e = Error(`user ${name} already exist`)
      e.name = 'RegError'
      throw e
    }
    throw err
  }
}

/** 验证用户 */
export async function validateUser(name: string, pass: string) {
  const password = sha256(pass)
  const user = await User.findOne({ name })
  if (user.password === password) {
    return user
  }
  const e = Error('username or password is invalid')
  e.name = 'LoginError'
  throw e
}

mongoose.connection.on('error', () => {
  console.error('Cannot connect to mongodb')
  process.exit(1)
})
mongoose.connection.once('open', () => {
  console.log('mongodb connected')
})

// TODO: when to close connection
// process.on('SIGINT', function() {
//   mongoose.connection.close(() => {
//     console.log('mongodb connection is closed')
//     process.exit(0)
//   })
// })
