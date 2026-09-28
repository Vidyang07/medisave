import mongoose from "mongoose";

const connectDB = async () => {
  const primaryUri = process.env.MONGO_URI;
  const fallbackUri = "mongodb://127.0.0.1:27017/medisave";

  try {
    const connection = await mongoose.connect(primaryUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected (Primary): ${connection.connection.host}`);
  } catch (error) {
    console.warn(`Primary MongoDB connection failed (${error.message}). Attempting fallback to local MongoDB...`);
    try {
      const fallbackConn = await mongoose.connect(fallbackUri, {
        serverSelectionTimeoutMS: 4000,
      });
      console.log(`MongoDB Connected (Local Fallback): ${fallbackConn.connection.host}`);
    } catch (fallbackError) {
      console.error("All MongoDB Connections Failed:", fallbackError.message);
    }
  }
};

export default connectDB;