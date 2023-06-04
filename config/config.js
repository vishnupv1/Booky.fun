const myEnv = require('dotenv').config()
const sessionSecret = process.env.SESSIONSECRET
const emailUser = process.env.EMAILUSER
const passwordUser = process.env.PASSWORDUSER




module.exports = {
    sessionSecret,
    emailUser,
    passwordUser
}
