require('dotenv').config()
const request = require('request')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const { User,  } = require('../models')
const { Op, Sequelize } = require('sequelize')

let smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.YOUR_EMAIL, // Your email address
      pass: process.env.YOUR_PASSWORD // Your password
    },
    tls: {
      rejectUnauthorized: false
    }
})

const addUser = (req, res) => {
    const { firstName, lastName, email, dateOfBirth, phoneNumber, street1, street2, city, state, country, zipcode } = req.body
    const baseURL = 'http://api.positionstack.com/v1/forward?'
    const accessKey = 'access_key=7013ce1a0e0259459de4276a6b61dcaa&query='
    const queries = `${street1},${street2},${city},${state},${country},${zipcode}`
    const url = baseURL + accessKey + queries

    request({ url:url, json:true }, async (err, response) => {
        try {
            const result = response.body
            if (result.data = []) {
                res.status(404).json({ message: 'Please enter valid address' })
            }
            const latitude = result.data[0].latitude 
            const longitude = result.data[0].longitude
            const point = { type: 'Point', coordinates: [latitude, longitude]}
            const user = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                dateOfBirth: dateOfBirth,
                phoneNumber: phoneNumber,
                street1: street1,
                street2: street2,
                city: city,
                state: state,
                country: country,
                zipcode: zipcode,
                location: point
            }
            const newUser = await User.create(user)
            const saveNewUser = await newUser.save()
    
            const accessToken = jwt.sign(
                { user: { email: saveNewUser.email } },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15s' }
            )
            const refreshToken = jwt.sign(
                { user: { email: saveNewUser.email } },
                process.env.REFRESH_TOKEN_SECRET,
                { expiresIn: '1d' }
            )
    
            res.cookie('access_token', accessToken, {
                httpOnly: true,
                maxAge: 15 * 1000 // 15 seconds
            })
            res.cookie('refresh_token', refreshToken, {
                httpOnly: true,
                maxAge: 60 * 60 * 24 * 1000 // 1 day
            })
    
            let mailOptions  = {
                from : process.env.YOUR_EMAIL, // Sender address (you)
                to: req.body.email, // Receiver address
                subject: 'Hello', // Subject line
                html: `<h2> Welcome ${req.body.firstName}</h2>`  // HTML body
              }
        
              smtpTransporter.sendMail(mailOptions, (err, info) => {
                if (err) {
                  console.log(err)
                }
                console.log(info)
              })
    
            res.json(saveNewUser)
        } catch (error) {
            res.status(500).json({ message:'Server error' })
        }
    })
}

const updateUser = async (req, res) => {
    const { id } = req.params

    try {
        const user = await User.findOne({ where: { id: id } })
        if (!user) {
            return res.status(404).json({ message: 'User not founded' })
        }
        const { firstName, lastName, email, dateOfBirth, phoneNumber, street1, street2, city, state, country, zipcode } = req.body
        const baseURL = 'http://api.positionstack.com/v1/forward?'
        const accessKey = 'access_key=7013ce1a0e0259459de4276a6b61dcaa&query='
        const queries = `${street1},${street2},${city},${state},${country},${zipcode}`
        const url = baseURL + accessKey + queries
        request({ url:url, json:true }, async (err, response) => {
            const result = response.body
            const latitude = result.data[0].latitude
            const longitude = result.data[0].longitude
            const location = [latitude, longitude]
            const newUser = {
                firstName: firstName,
                lastName: lastName,
                email: email,
                dateOfBirth: dateOfBirth,
                phoneNumber: phoneNumber,
                street1: street1,
                street2: street2,
                city: city,
                state: state,
                country: country,
                zipcode: zipcode,
                location: location
            }
            const updateUser = await User.create(newUser)
            const saveUpdatedUser = await updateUser.save()
            res.json(saveUpdatedUser)
        })
    } catch (error) {
        res.status(500).json({ message:'Server error' })
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findOne({ where: { id: id } })
        if (!user) {
            return res.status(404).json({ message: 'User not founded' })
        }
        res.json(user)
    } catch (error) {
        res.status(500).json({ message:'Server error' })
    }
}

const getAllUsers = async (req, res) => {
    try {
        const sortby = req.query.sortby ? req.query.sortby : 'firstName'
        const order = req.query.order ? req.query.order : 'ASC'
        const offset = req.query.offset ? parseInt(req.query.offset) : undefined
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined
        const users = await User.findAll({
            order: [[sortby,order]],
            offset: offset,
            limit: limit
        })
        res.json(users)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:'Server error' })
    }
}

const getUsersByDistance = async (req, res) => {
    const { id } = req.params
    try {
        const user = await User.findOne({ where: { id: id } })
        if (!user) {
            return res.status(404).json({ message: 'User not founded' })
        }
        const userLatitude = user.location.coordinates[0]
        const userLongitude = user.location.coordinates[1]
        const location = Sequelize.literal(`ST_GeomFromText('POINT(${userLatitude} ${userLongitude})', 4326)`)
        const users = await User.findAll({
            attributes: {
                include: [[Sequelize.fn('ST_DistanceSphere', Sequelize.literal('location'), location),'distance']]
            },
            order: [['location','ASC']],
            limit: 10
        })
        res.json(users)
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:'Server error' })
    }
}

const getUsersByAge = async (req, res) => {
    try {
        const date  = new Date()
        const order = req.query.order ? req.query.order : 'DESC'
        const users = await User.findAll({
            where: {
                dateOfBirth: {
                    [Op.gte]: "1900-01-01T00:00:00.000Z",
                    [Op.lt]: date
                }
            },
            order: [['dateOfBirth', order]]
        })
        res.json(users)
    } catch (error) {
        res.status(500).json({ message:'Server error' })
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params
        const user = await User.findOne({ where: { id: id } })
        if (!user) {
        return res.status(404).json({ message: 'User not founded' })
        }
        await user.destroy()
        res.json({ message: 'Your account deleted' })
    } catch (error) {
        res.status(500).json({ message: 'Server error' })
    }
}

const logoutUser = (req, res) => {
    res.cookie('access_token', '', { maxAge: 0 })
    res.cookie('refresh_token', '', { maxAge: 0 })
    res.json({ message: 'You logout' })
} 


module.exports = {
    addUser,
    updateUser,
    getUserById,
    getAllUsers,
    getUsersByDistance,
    getUsersByAge,
    deleteUser,
    logoutUser
}
