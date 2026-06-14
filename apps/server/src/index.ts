import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import APIRouterV1 from "@/routes/index.routes.js";
import { errorHandler } from "./utils/api.utils.js";

const app = express();

app.use(
	cors({
		origin: process.env.CLIENT_URL,
		credentials: true,
	}),
);

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/v1", APIRouterV1);

app.use(errorHandler);

app.listen(process.env.SERVER_PORT, () => {
	console.log(`server started on ${process.env.SERVER_PORT}`);
});
