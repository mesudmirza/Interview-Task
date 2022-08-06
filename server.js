require('dotenv').config()
const express = require('express')
const app = express()
const bodyParser  = require('body-parser')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const { sequelize } = require('./models')

const port  = 5000

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser())

app.use('/user', require('./routes/user'))

app.listen(port, async (req, res) => {
    console.log(`Server running on ${port} port`)
    await sequelize.authenticate()
    console.log('Database connected!')
})