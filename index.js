import "dotenv/config";
import "./config/database.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.js";
import tasksRouter from "./routes/tasks.js";
import usersRouter from "./routes/users.js";
import errorsHandler from "./middlewares/errorsHandler.js";

const app = express();

const whiteList = [process.env.FRONTEND];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whiteList.includes(origin)) {
        return callback(null, origin);
      }
      return callback("Not allowed by CORS");
    },
    methods: "GET,PATCH,POST,DELETE",
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/users", usersRouter);

app.use(errorsHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at ${port} port 🔥`);
});
