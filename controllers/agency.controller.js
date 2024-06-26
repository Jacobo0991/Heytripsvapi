const Agency = require('../models/Agency.model');
const User = require('../models/User.model')

const controller = {}

//Delete agency
controller.deleteAgency = async(req, res, next) => {
    try {
        const {id} = req.body
        await Agency.deleteOne({_id: id})
        const agencies = await Agency.find({ reports: { $exists: true, $not: { $size: 0 } } }, '_id email name dui description image instagram facebook reports').sort({ createdAt: -1 }).populate("reports.user", "name");
        res.status(200).json(agencies)
    } catch (error) {
        next(error)
    }
}

//Obtener las agencias reportadas
controller.findReported = async (req, res, next) => {
    try {

        const agencies = await Agency.find({ reports: { $exists: true, $not: { $size: 0 } } }, '_id email name dui description image instagram facebook reports').sort({ createdAt: -1 }).populate("reports.user", "name");


        return res.status(200).json(agencies);

    } catch (error) {
        next(error);
    }
}

//Eliminar reporte
controller.undoReport = async (req, res, next) => {
    try {
        const {id} = req.params
        const agency = await Agency.findOne({_id: id})
        agency.reports = []
        const newAgency = await agency.save()
        if (!newAgency) {
            return res.status(500).json({error: "Error removing the agency from reported"})
        }

        const agencies = await Agency.find({ reports: { $exists: true, $not: { $size: 0 } } }, '_id email name dui description image instagram facebook reports').sort({ createdAt: -1 }).populate("reports.user", "name");
        return res.status(200).json(agencies)

    } catch (error) {
        next(error)
    }
}

//Reportar agencia
controller.reportAgency = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const { _id } = req.user;

        let agency = await Agency.findOne({ _id: id });
        let user = await User.findOne({_id: _id})

        if (!agency) {
            return res.status(404).json({ error: "Agency not found" })
        }
        if (!user) {
            return res.status(403).json({error: "Forbidden"})
        }

        let _reports = agency.reports;

        const prevIndex = _reports.findIndex(r => r.user.equals(_id));

        if (prevIndex >= 0) {
            //El comentario ya existe
            const _report = _reports[prevIndex];
            _report.content = content;
            _reports[prevIndex] = _report;
        } else {
            //El comentario no existe
            _reports = [..._reports, { user: _id, content: content }]

        }
        //Guardamos el post - commit
        agency["reports"] = _reports;
        const newAgency = await agency.save();

        //Retornamos el post actualizado
        if (newAgency) {
            return res.status(200).json({ result: "Agency reported" });
        }else{
            return res.status(500).json({error: "There was an error reporting the agency"})
        }
    } catch (error) {
        next(error);
    }
}


controller.editOwn = async (req, res, next) => {
    try {
        let {_id} = req.user;   
        let {name, email, dui, description, number, instagram, facebook, password} = req.body;
        let image = req.file ? true : false;
        let user = await Agency.findOne({_id: _id});
        if(!user){
            return res.status(404).json({error: "User not found"})
        }

        user.name = name;
        user.email = email;
        user.dui = dui;
        user.description = description;
        user.number = number,
        user.instagram = instagram,
        user.facebook = facebook

        const newUser = await user.save();

        if (!newUser) {
            return res.status(500).json({error: "There was an error updating the profile"});
        }

        if (!image) {
            ({ _id, email, name, phone, dui, description, image, instagram, facebook} = newUser);

            return res.status(200).json({_id, email, name, phone, dui, description, image, instagram, facebook });
        }

        const timestamp = Math.round(new Date().getTime() / 1000);
        const signature = cloudinary.utils.api_sign_request({
            timestamp: timestamp,
            public_id: _id,
            upload_preset: "FoundHound",
            overwrite: true
        }, process.env.CLOUDINARY_SECRET);
        const b64 = Buffer.from(req.file.buffer).toString("base64");
        let dataURI = "data:" + req.file.mimetype + ";base64," + b64;
        const formData = new FormData();
        formData.append("file", dataURI);
        formData.append("upload_preset", "FoundHound");
        formData.append("cloud_name", "dlmtei8cc")
        formData.append("public_id", _id);
        formData.append("overwrite", true);
        formData.append("api_key", process.env.CLOUDINARY_API_KEY)
        formData.append("timestamp", timestamp);
        formData.append("signature", signature);

        const dataRes = await axios.post(
            process.env.CLOUDINARY_U,
            formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
        }
        );
        imageUrl = dataRes.data.url;

        newUser.image = imageUrl;

        const _newUser = await newUser.save();

        if (!_newUser) {
            return res.status(200).json({ message: "Profile updated, but there was an error saving the profile picture" });

        }

        ({ _id, email, name, phone, dui, description, image, instagram, facebook} = _newUser);

        return res.status(200).json({_id, email, name, phone, dui, description, image, instagram, facebook });
    } catch (error) {
        next(error)
    }
}

module.exports = controller