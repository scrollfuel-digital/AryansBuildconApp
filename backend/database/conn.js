import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "./config.env" });

const connectDB = async () => {
    try {
        const db = await mongoose.connect(process.env.MONGO_URI);

        console.log(
            `MongoDB connected with server: ${db.connection.host}`
        );
    } catch (error) {
        console.error(`Error in DB connection: ${error.message}`);
        process.exit(1);
    }
    
};

export default connectDB;