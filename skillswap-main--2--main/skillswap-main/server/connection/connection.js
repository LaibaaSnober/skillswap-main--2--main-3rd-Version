import mongoose from "mongoose";

export const Connection = async () => {
  try {
    console.log("Connecting to database...", process.env.MONGODB_URI);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: "Dvote",
    });

    console.log(`Database connected successfully: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Database connection failed: ${err.message}`);
  }
};