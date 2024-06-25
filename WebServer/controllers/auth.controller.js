const User = require('../models/User.model');
const Agency = require('../models/Agency.model');
const axios = require('axios')
const cloudinary = require('cloudinary').v2
const { createToken, verifyToken } = require("../utils/jwt.tools");
const { sendEmailWithNodemailer } = require("../utils/email.tools");

const controller = {}

controller.registerUser = async (req, res, next) => {
    try {
        //Obtener la información del usuario
        const { name, email, password } = req.body;

        //Revisar si el usuario ya existe
        const user = await User.findOne({ email: email });
        if (user) {
            return res.status(409).json({ error: "User already exists" })
        }

        const newUser = new User({
            name: name,
            email: email,
            password: password
        });
        const savedUser = await newUser.save();

        return res.status(200).json({ message: "User registered" })
    } catch (error) {
        next(error.message)
    }
}

controller.registerAgency = async (req, res, next) => {
    try {
        const { name, email, dui, description, number, instagram, facebook, password } = req.body
        const image = req.file ? true : false

        //Verificar la existencia de la agencia
        const agency = await Agency.findOne({ $or: [{ email: email }, { name: name }, { dui: dui }] });
        if (agency) {
            return res.status(409).json({ error: "Agency already exists" });
        }

        const newAgency = new Agency({
            name: name,
            email: email,
            dui: dui,
            description: description,
            number: number,
            instagram: instagram,
            facebook: facebook,
            image: "",
            password: password
        });

        const savedAgency = await newAgency.save();

        if (!image) {
            return res.status(200).json({ message: "Agency registered" });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            public_id: savedAgency._id,
            upload_preset: "FoundHound",
            overwrite: true
        }, process.env.CLOUDINARY_SECRET);

        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const formData = new FormData();
        formData.append("file", dataURI);
        formData.append("upload_preset", "FoundHound");
        formData.append("cloud_name", "dlmtei8cc")
        formData.append("public_id", savedAgency._id);
        formData.append("overwrite", true);
        formData.append("api_key", process.env.CLOUDINARY_API_KEY)
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        const dataRes = await axios.post(
            process.env.CLOUDINARY_U,
            formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                ...formData.getHeaders ? formData.getHeaders() : ""
            }
        }
        );
        imageUrl = dataRes.data.url;

        savedAgency.image = imageUrl;
        const imgAgency = await savedAgency.save();

        if (!imgAgency) {
            return res.status(200).json({ message: "Agency registered, but there was an error saving the profile image" });
        }

        return res.status(200).json({ message: "Agency registered" });

    } catch (error) {
        console.log(error);
        next(error.message);
    }
}

controller.login = async (req, res, next) => {
    try {
        //Obtener la info identificador, contrasenia y el rol
        const { email, password } = req.body;
        let user, agency;

        //Verificar si el usuario existe basado en el rol
        user = await User.findOne({ email: email });
        //Si no existe, verificar si existe la agencia
        if (!user) {
            agency = await Agency.findOne({ email: email });

            if (!agency) {
                return res.status(404).json({ error: "User not found" });
            }
            //Verificar la contraseña
            //Si no coincide, 401
            if (!agency.comparePassword(password)) {
                return res.status(401).json({ error: "Invalid password" });
            }

            //Si coindice, logear
            //Crear un token
            const token = await createToken(agency._id);

            //Almacenar token
            let _tokens = [...agency.tokens];
            const _verifyPromises = _tokens.map(async (_t) => {
                const status = await verifyToken(_t);

                return status ? _t : null;
            });
            _tokens = (await Promise.all(_verifyPromises)).filter(_t => _t).slice(0, 4);
            //Verificar la integridad de los token actuales max 5 sesiones por usuario

            _tokens = [token, ..._tokens];
            agency.tokens = _tokens;
            await agency.save();
            return res.status(200).json({ token: token, role: "agency" })
        }

        //Verificar la contrasenia
        //Si no coincide, 401
        if (!user.comparePassword(password)) {
            return res.status(401).json({ error: "Invalid Password" });
        }

        //Si coindice, logear
        //Crear un token
        const token = await createToken(user._id);

        //Almacenar token
        let _tokens = [...user.tokens];
        const _verifyPromises = _tokens.map(async (_t) => {
            const status = await verifyToken(_t);

            return status ? _t : null;
        });
        _tokens = (await Promise.all(_verifyPromises)).filter(_t => _t).slice(0, 4);
        //Verificar la integridad de los token actuales max 5 sesiones por usuario

        _tokens = [token, ..._tokens];
        user.tokens = _tokens;
        await user.save();
        let role = "";
        let saved = []
        if (user.admin) {
            role = "admin"
        }else {
            role = "user"
            saved = user.saved
        }
        return res.status(200).json({ token: token, role: role, saved: saved })

    } catch (error) {
        next(error)
    }
}

controller.whoamiuser = async (req, res, next) => {
    try {
        const { _id, email, name, saved } = req.user;
        return res.status(200).json({ _id, email, name, saved });
    } catch (error) {
        next(error)
    }
}

controller.whoamiagency = async (req, res, next) => {
    try {
        const { _id, name, email, dui, description, number, instagram, facebook, image } = req.user;
        return res.status(200).json({ _id, name, email, dui, description, number, instagram, facebook, image });
    } catch (error) {
        next(error)
    }
}

//Enviar código de recuperación de contraseña
controller.sendCode = async (req, res, next) => {
    try {
        const { email } = req.body;

        //Verificar si el usuario existe
        const user = await User.findOne({ email: email });

        if (!user) {
            const agency = await Agency.findOne({ email: email })

            if (!agency) {
                return res.status(404).json({ error: "User not found" });
            }

            const agencyMail = agency.email;

            //Genera código, guardarlo
            let code = '';
            while (code.length < 5) {
                code += Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
            }
            code = code.substring(0, 5).toUpperCase();

            agency.code = code;
            agency.codeDate = new Date();
            let _agency = await agency.save();

            if (!_agency) {
                return res.status(500).json({ error: "Error sending code" });
            }

            //Enviar código por correo
            const emailData = {
                from: "foundhound09@gmail.com",
                to: agency.email,
                subject: `Password recovery`,
                html: `
                    <p>We've noticed you're having trouble with your password, to reset it enter the following code: ${code}</p>
                    <p>This code expires in 5 minutes</p>
                    <br>
                    <p>If you didn't request a password change, ignore this mail<p>
                `,
            };

            let emailConfirmation = await sendEmailWithNodemailer(req, res, emailData);
            if (!emailConfirmation) {
                return res.status(500).json({ error: "Internal server error" })
            }

            return res.status(200).json({ message: "Code sent" });
        }

        const userMail = user.email;

        //Genera código, guardarlo
        let code = '';
        while (code.length < 5) {
            code += Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
        }
        code = code.substring(0, 5).toUpperCase();

        user.code = code;
        user.codeDate = new Date();
        let _user = await user.save();

        if (!_user) {
            return res.status(500).json({ error: "Error sending code" });
        }

        //Enviar código por correo
        const emailData = {
            from: "foundhound09@gmail.com",
            to: user.email,
            subject: `Password recovery`,
            html: `
                    <p>We've noticed you're having trouble with your password, to reset it enter the following code: ${code}</p>
                    <p>This code expires in 5 minutes</p>
                    <br>
                    <p>If you didn't request a password change, ignore this mail<p>
                `,
        };

        const emailConfirmation = await sendEmailWithNodemailer(req, res, emailData);
        if (!emailConfirmation) {
            return res.status(500).json({ error: "Internal server error" })
        }

        return res.status(200).json({ message: "Code sent" });

    } catch (error) {
        next(error)
    }
}

// Controlador para verificar el código
controller.compareCode = async (req, res, next) => {
    try {
        const { email, code } = req.body;

        let user = await User.findOne({ email: email });
        let agency;

        if (!user) {
            agency = await Agency.findOne({ email: email });
            if (!agency) {
                return res.status(404).json({ error: "User not found" });
            }

            if (!agency.compareCode(code) || !checkCodeDate(new Date(), agency.codeDate)) {
                return res.status(401).json({ error: "Invalid code" });
            }

            return res.status(200).json({ message: "Correct code" });
        }

        if (!user.compareCode(code) || !checkCodeDate(new Date(), user.codeDate)) {
            return res.status(401).json({ error: "Invalid code" });
        }

        return res.status(200).json({ message: "Correct code" });
    } catch (error) {
        next(error);
    }
};

// Controlador para cambiar la contraseña
controller.changePassword = async (req, res, next) => {
    try {
        const { email, pass } = req.body;

        let user = await User.findOne({ email: email });
        let agency;

        if (!user) {
            agency = await Agency.findOne({ email: email });
            if (!agency) {
                return res.status(404).json({ error: "User not found" });
            }

            if (pass) {
                agency.password = pass;
                const updatedAgency = await agency.save();

                if (!updatedAgency) {
                    return res.status(500).json({ error: "There was an error updating the password" });
                }

                return res.status(200).json({ message: "Password updated correctly" });
            }

            return res.status(200).json({ message: "Correct code" });
        }


        if (pass) {
            user.password = pass;
            const updatedUser = await user.save();

            if (!updatedUser) {
                return res.status(500).json({ error: "There was an error updating the password" });
            }

            return res.status(200).json({ message: "Password updated correctly" });
        }

        return res.status(200).json({ message: "Correct code" });
    } catch (error) {
        next(error);
    }
};

// Función para generar un código aleatorio
function generateRandomCode() {
    let _code = '';
    while (_code.length < 5) {
        _code += Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
    }
    return _code.substring(0, 5).toUpperCase();
}

//Verificar el tiempo de vencimiento del código de recuperación
function checkCodeDate(date1, date2) {
    // Obtener la diferencia entre las dos fechas
    const diff = Math.abs(date1 - date2);
    // Define el límite de tiempo en milisegundos (5 minutos)
    const limit = 5 * 60 * 1000;

    // verificar que la diferencia sea menor a los 5 minutos
    return diff <= limit;
}

module.exports = controller
