const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const { addUser, updateUser, getUserById, getAllUsers, deleteUser, logoutUser, getUsersByAge, getUsersByDistance } = require('./../controller/user')
const { validation } = require('../middleware/validation')
const { verifyTokens } = require('../middleware/auth')

router.post('/', addUser, validation)

router.get('/logout', logoutUser)

router.get('/list', getAllUsers, verifyTokens)

router.get('/list/distance/:id', getUsersByDistance, verifyTokens)

router.get('/list/age', getUsersByAge, verifyTokens)

router.get('/:id', getUserById, verifyTokens)

router.put('/update/:id', updateUser, verifyTokens)

router.delete('/delete/:id', deleteUser, verifyTokens)

module.exports = router