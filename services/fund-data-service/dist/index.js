"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fundFetcher_1 = require("./fundFetcher");
const ioredis_1 = __importDefault(require("ioredis"));
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
const redis = new ioredis_1.default(process.env.REDIS_URL);
const getFundDataHandler = async (req, res) => {
    try {
        const { ticker } = req.params;
        const cacheKey = `fund:${ticker}:returns`;
        const cachedData = await redis.get(cacheKey);
        if (cachedData) {
            res.json(JSON.parse(cachedData));
            return;
        }
        const data = await (0, fundFetcher_1.getFundReturns)(ticker, req);
        await redis.set(cacheKey, JSON.stringify(data), 'EX', 86400); // Cache for 24 hours
        res.json(data);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
app.get('/fund/:ticker', getFundDataHandler);
app.listen(port, () => {
    console.log(`Fund data service listening on http://localhost:${port}`);
});
