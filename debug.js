const dotenv = require('dotenv');
dotenv.config();

try {
    console.log("Loading app...");
    const app = require('./app');
    console.log("App loaded.");
    
    console.log("Connecting DB...");
    const mongoose = require('mongoose');
    mongoose.connect(process.env.MONGO_URI).then(() => {
        console.log("DB Connected.");
        process.exit(0);
    }).catch(err => {
        console.error("DB Connection Failed:", err);
        process.exit(1);
    });

} catch (err) {
    console.error("CRASH DURING LOAD:");
    console.error(err);
}
