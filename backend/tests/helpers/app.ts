import express from "express";
import helmet from "helmet";
import routes from "../../src/routes";

export function buildApp() {
    const app = express();
    app.use(helmet());
    app.use(express.json());
    app.use("/api", routes);
    return app;
}
