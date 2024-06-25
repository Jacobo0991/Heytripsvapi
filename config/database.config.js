const Mongoose = require("mongoose");
require('dotenv').config();

const dburi = process.env.DBURI;

// Connect to database method

const connect = async () => {
    try {
        await Mongoose.connect(dburi);
        console.log("Connection successful");
    } catch (error) {
        console.error(error);
        console.log('Cannot connect to database');
        process.exit(1);
    }
}

//Disconnect to database
const disconnect = async () => {
    try {
        await Mongoose.disconnect();
        console.log("Disconnected from database");
    } catch (error) {
        process.exit(1)
    }
}

module.exports = {
    connect,
    disconnect
}