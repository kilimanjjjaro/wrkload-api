import "dotenv/config";
import "./config/database.js";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.routes.js";
import tasksRouter from "./routes/tasks.routes.js";
import usersRouter from "./routes/users.routes.js";
import projectsRouter from "./routes/projects.routes.js";
import errorsHandler from "./middlewares/errorsHandler.middleware.js";

const app = express();

const whiteList = [process.env.FRONTEND_URL];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || whiteList.includes(origin)) {
        return callback(null, origin);
      }
      return callback("Not allowed by CORS");
    },
    methods: "GET,PATCH,POST,DELETE",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/tasks", tasksRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/projects", projectsRouter);

app.use(errorsHandler);

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running at ${port} port 🔥`);
});
