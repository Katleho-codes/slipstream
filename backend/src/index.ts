import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import routes from "./routes";
import { apiReference } from "@scalar/express-api-reference";
import openapiSpec from "./openapi.json";
dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 8001;

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
    cors({
        origin: process.env.FRONTEND_URL ?? "http://localhost:3003",
        credentials: true, // required — Better Auth uses cookies
    }),
);

// 1. Enable proxy trust (Crucial for production environments)
// Options: true, 1 (trust 1 hop), 'loopback', or specific IP subnets
app.set("trust proxy", 1);

// ─── Rate limiting ────────────────────────────────────────────────────────────
app.use(
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
    }),
);

app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Better Auth handler ──────────────────────────────────────────────────────
// Mounts: /api/auth/sign-in, /api/auth/sign-up, /api/auth/sign-out,
//         /api/auth/session, /api/auth/callback, etc.
// todo: remove in prod
app.get("/ip", (request, response) => {
    response.send(request.ip);
});
app.all("/api/auth/*", toNodeHandler(auth));

// ─── API Documentation (Scalar) ───────────────────────────────────────────────
app.get("/openapi.json", (_req, res) => {
    res.json(openapiSpec);
});

// todo: remove in prod
app.use(
    "/reference",
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                "style-src": [
                    "'self'",
                    "'unsafe-inline'",
                    "fonts.googleapis.com",
                ],
                "font-src": ["'self'", "fonts.gstatic.com"],
                "img-src": ["'self'", "data:", "cdn.jsdelivr.net"],
                "connect-src": ["'self'"],
            },
        },
    }),
    apiReference({ theme: "purple", url: "/openapi.json" }),
);

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        service: "SlipStream API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
    });
});

// ─── Application routes ───────────────────────────────────────────────────────
app.use("/api", routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(
    (
        err: Error,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
    ) => {
        console.error("[Unhandled error]", err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    },
);
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 SlipStream API running on port ${PORT}`);
    // console.log(
    //     `   Auth:   http://localhost:${PORT}/api/auth/sign-up  (Better Auth)`,
    // );
    // console.log(`   Health: http://localhost:${PORT}/health`);
    // console.log(`   Verify: http://localhost:${PORT}/api/verify/:token\n`);
});

export default app;
