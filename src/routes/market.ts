import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  placeBet,
  createMarket,
  getMarkets,
  getBets,
} from "../controller/market";

const marketRouter = Router();

marketRouter.post("/", authMiddleware, createMarket);
marketRouter.get("/", getMarkets);

marketRouter.post("/bet", authMiddleware, placeBet);
marketRouter.post("/bets", authMiddleware, getBets);

export default marketRouter;
