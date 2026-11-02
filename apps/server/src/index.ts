import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import APIRouterV1 from "@/routes/index.routes.js";
import triggerRouter from "@/routes/trigger.routes.js";
import { errorHandler, RequestTimeOutHandler } from "./utils/api.utils.js";

const app = express();
const isProduction = process.env.NODE_ENV === "production";

app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				"upgrade-insecure-requests": isProduction ? [] : null,
			},
		},
		strictTransportSecurity: isProduction ? undefined : false,
	}),
);

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	}),
);

app.use(cookieParser());
app.use(RequestTimeOutHandler);

app.use("/api/v1/triggers", triggerRouter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/v1", APIRouterV1);

app.use(errorHandler);

app.listen(process.env.SERVER_PORT, () => {
	console.log(`server started on ${process.env.SERVER_PORT}`);
});
