"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const notFoundMiddleware_1 = require("./module/middleware/notFoundMiddleware");
const globalErrorHandler_1 = require("./module/middleware/globalErrorHandler");
const routes_1 = require("./module/routes");
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// =================Routes=====================
app.use("/api/v1", routes_1.IndexRoutes);
app.get('/', (req, res) => {
    res.send('PerCelGo Server is running successfully with MVC architecture.');
});
app.use(notFoundMiddleware_1.notFound);
app.use(globalErrorHandler_1.globalErrorHandler);
exports.default = app;
