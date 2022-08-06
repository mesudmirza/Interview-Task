require('dotenv').config()
const jwt = require('jsonwebtoken')

const verifyTokens = (req, res, next) => {
    const accessToken = req.cookies['access_token']
    const refreshToken = req.cookies['refresh_token']

    if (accessToken) {
        jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({
                    message: 'Token is not valid'
                })
            } else {
                req.user = decoded.user
                next()
            }
        })
    } else {
        if (refreshToken) {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        message: 'Token is not valid'
                    })
                } else {
                    req.user = decoded.user
                    next()
                }
            })
        } else {
            return res.status(401).json({
                message: 'No token, auth denied'
            })
        }
    }
}

module.exports = { verifyTokens }