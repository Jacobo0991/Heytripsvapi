const Mongoose = require("mongoose")
const Schema = Mongoose.Schema

const postSchema = new Schema({
    title: {
        type: String,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    meeting: {
        type: String,
        trim: true,
        required: true
    },
    itinerary: {
        type: [{
            time: {
                type: Date,
                required: true
            },
            event: {
                type: String,
                required: true,
                trim: true
            }
        }],

    },
    includes: {
        type: [String],
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    lat: {
        type: Number,
        required: true
    },
    long: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: "https://res.cloudinary.com/dlmtei8cc/image/upload/v1718430757/zjyr4khxybczk6hjibw9.jpg"
    },
    price: {
        type: Number,
        required: true
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
    agency: {
        type: Schema.Types.ObjectId,
        ref: "Agency"
    },

}, {timestamps: true});

module.exports = Mongoose.model("Post", postSchema);