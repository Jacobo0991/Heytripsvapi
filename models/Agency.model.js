const Mongoose = require("mongoose")
const Post = require('./Post.model')
const crypto = require("crypto");
const Schema = Mongoose.Schema;

const agencySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    dui: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    number: {
        type: String,
        trim: true,
        required: true
    },
    instagram: {
        type: String,
        trim: true
    },
    facebook: {
        type: String,
        trim: true
    },
    image: {
        type: String,
        default: "https://res.cloudinary.com/dlmtei8cc/image/upload/v1718430757/zjyr4khxybczk6hjibw9.jpg"
    },
    hashedPassword: {
        type: String,
        required: true
    },
    hashedCode: {
        type: String
    },
    codeDate: {
        type: Date
    },
    salt: {
        type: String
    },
    reports: {
        type: [{
            user: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            content: {
                type: String,
                required: true
            },
        }],
        default: []  
    },
    tokens: {
        type: [String],
        default: []
    }
}, {timestamps: true});

agencySchema.methods= {
    encryptPassword: function(password){
        if(!password) return "";
        try {
            const _password = crypto.pbkdf2Sync(
                password,
                this.salt,
                1000, 64,
                 `sha512`
            ).toString("hex");
            return _password;

        } catch (error) {
            console.log(error);
            return "";
        }
    },
    compareCode: function (code){
        return this.hashedCode === this.encryptPassword(code);
    },
    makeSalt: function (){
        return crypto.randomBytes(16).toString("hex");
    },
    comparePassword: function (password){
        return this.hashedPassword === this.encryptPassword(password)
    }
}

agencySchema
    .virtual("password")
    .set(function(password = crypto.randomBytes(16).toString()){
        this.salt = this.makeSalt();
        this.hashedPassword = this.encryptPassword(password);
    });

//Al setear password se crea una nueva salt,
//Antes de volver a setear (actualizar) la contra, necesita confirmar el código, por lo que siempre se usará la que se crea con la contra
agencySchema  
    .virtual("code")
    .set(function(code = crypto.randomBytes(16).toString()){
        this.hashedCode = this.encryptPassword(code);
    });

agencySchema.pre('deleteOne', async function(next) {
    try {
        await Post.deleteMany({agency: this._id});
        next();
    } catch (error) {
        next(error);
    }
})

module.exports = Mongoose.model("Agency", agencySchema)