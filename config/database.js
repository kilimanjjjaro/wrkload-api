import mongoose from "mongoose";

try {
  await mongoose.connect(process.env.DATABASE);
  console.log("Database connected");
} catch (error) {
  console.error(error);
}
