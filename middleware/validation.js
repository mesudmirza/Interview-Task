const { User } = require('../models')

const validation = async (req, res, next) => {
    if (!req.body.firstName,
        !req.body.lastName,
        !req.body.email,
        !req.body.dateOfBirth,
        !req.body.phoneNumber,
        !req.body.street1,
        !req.body.street2,
        !req.body.city,
        !req.body.state,
        !req.body.country,
        !req.body.zipcode
    ) {
        res.json({ message: "Please enter all fields" })
    }
    const user  = await User.findOne({ where: { email: req.body.email } })
    if (user) {
        res.json({ message: 'This email already exists' })
    }
    next()
}

module.exports = { validation }