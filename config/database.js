import mongoose from "mongoose";

// CONNECTION TO DATABASE
try {
  await mongoose.connect(process.env.DATABASE);
  console.log("Database connected");
} catch (error) {
  console.error(error);
}
