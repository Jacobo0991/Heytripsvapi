const User = require('../models/User.model');

const controller = {}

controller.editOwn = async (req, res, next) => {
    try {
        let {_id} = req.user;
        let {name, email} = req.body;
        const user = await User.findOne({_id: _id});
        if(!user){
            return res.status(404).json({error: "User not found"})
        }

        user.name = name;
        user.email = email;

        const newUser = await user.save();

        if (!newUser) {
            return res.status(500).json({error: "There was an error updating the profile"});
        }

        ({_id, name, email} = newUser);
        return res.status(200).json({_id, name, email});

    } catch (error) {
        next(error)
    }
}

controller.getSaved = async(req, res, next) => {
    try{
        const {_id} = req.user
        const user = await User.findOne({_id: _id}).populate({
            path: 'saved',
            select: 'title description date meeting itinerary includes category lat long image price agency',
            populate: {
                path: 'agency',
                select: 'name number'
            }
        });

        if (!user) {
            return res.status(404).json({error: "Not found"})
        }

        return res.status(200).json({posts: user.saved})
    }catch(error){
        next(error)
    }
}

//Guarda el post o elimina de la lista si ya estaba
controller.savePost = async (req, res, next) => {
    try {
        const { _id } = req.user
        const { id } = req.params

        const user = await User.findOne({_id: _id})
        
        let _saved = user.saved;

        const prevIndex = _saved.findIndex(p => p.equals(id))
        if (prevIndex >= 0) {
            //El post está guardado

            //Se elimina de la lista de guardados
            _saved = _saved.filter((p) => p != id)
        }else{
            //El post no está guardado

            //Se agrega en la lista
            _saved.push(id)
        }

        user.saved = _saved

        //Se guarda el usuario
        const newUser = await user.save();
        return res.status(200).json({saved: newUser.saved})

    } catch (error) {
        next(error)
    }
}

module.exports = controller