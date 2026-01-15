import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connection.on("connected", () => {
    console.log("Database connection established");
  });
  try {
    await mongoose.connect(process.env.MONGODB_URL);
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1);
  }
};

export default connectDB;

//for Docker environment
// import mongoose from "mongoose";

// const connectDB = async () => {
//     mongoose.connection.on("connected", () => {
//         console.log("Database connection established");
//     });

//     try {
//         await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/agromart");
//     } catch (err) {
//         console.error("Database connection error:", err.message);
//         process.exit(1);
//     }
// };

// export default connectDB;
