const middlewares = {};
const { verifyToken } = require("../utils/jwt.tools");
const User = require("../models/User.model");
const Agency = require("../models/Agency.model");
const PREFIX = "Bearer";

middlewares.authentication = async (req, res, next) => {
    try {

        //Verificar el método de autorización
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ error: "User not authenticated" })
        }

        //Verificar validez del token
        const [prefix, token] = authorization.split(" ");
        if (prefix !== PREFIX || !token) {
            return res.status(401).json({ error: "User not authenticated" })
        }

        const payload = await verifyToken(token);

        if (!payload) {
            return res.status(401).json({ error: "User not authenticated" })
        }

        const userID = payload.sub;

        //Verificar el usuario
        let user = await User.findById(userID);

        if (!user) {

            let agency = await Agency.findById(userID)

            if (!agency) {
                return res.status(401).json({ error: "User not authenticated" })
            }
            //Comparar el token con los token registrados
            const isTokenValid = agency.tokens.includes(token);
            if (!isTokenValid) {
                return res.status(401).json({ error: "User not authenticated" })
            }

            //Verificar la peticion para añadir la informacion del usuario
            req.user = agency;
            req.token = token;

            return next();

        }

        //Comparar el token con los token registrados

        const isTokenValid = user.tokens.includes(token);
        if (!isTokenValid) {
            return res.status(401).json({ error: "Usuario no autenticado" })
        }

        //Verificar la peticion para añadir la informacion del usuario
        req.user = user;
        req.token = token;

        next();
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}

middlewares.authorization = async (req, res, next) => {

    //Antes de este middleware debe de haber pasado por la autenticacion
    try {
        const user = req.user;
        //Verificar si es admin
        const isAdmin = user.admin;

        //Si no esta, devolver 403
        if (!isAdmin) {
            return res.status(403).json({ error: "Forbidden" });
        }

        next();

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: "Internal server error" })
    }
}


middlewares.checkRepeatedEmail = async (req, res, next) => {
    try {
        const { _id } = req.user || false
        const { email } = req.body
        let user, agency

        if (_id) {
            user = await User.findOne({ $and: [{ email: email }, { _id: { $ne: _id } }] });
            agency = await Agency.findOne({ $and: [{ email: email }, { _id: { $ne: _id } }] });
        } else {
            user = await User.findOne({ email: email });
            agency = await Agency.findOne({ email: email});
        }

        if (user || agency) {
            return res.status(500).json({ error: "There is already an account with that email" })
        }

        next();
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "Internal server error" })
    }
}

module.exports = middlewares;