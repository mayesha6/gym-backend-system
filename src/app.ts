import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { router } from "./app/routes";

const app = express()

app.use(expressSession({
  secret: envVars.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(cookieParser())
app.use(express.json())
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }))
// app.use(cors({
//     origin: [envVars.FRONTEND_URL, envVars.FRONTEND_LOCALHOST_URL, envVars.DASHBOARD_URL, envVars.DASHBOARD_LOCALHOST_URL, envVars.FRONTEND_DOMAIN_URL, envVars.DASHBOARD_DOMAIN_URL],
//     credentials: true
// }))

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Request Origin:", origin);

      const allowedOrigins = [
        envVars.FRONTEND_URL,
        envVars.FRONTEND_LOCALHOST_URL,
        envVars.DASHBOARD_URL,
        envVars.DASHBOARD_LOCALHOST_URL,
        envVars.FRONTEND_DOMAIN_URL,
        envVars.DASHBOARD_DOMAIN_URL,
      ];

      console.log("Allowed Origins:", allowedOrigins);

      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use("/api/v1", router)

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to Dengodel System Backend"
  })
})

app.use(notFound)

app.use(globalErrorHandler)


export default app