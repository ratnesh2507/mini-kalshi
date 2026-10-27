import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { resolveMarket } from "../controller/resolve";

const resolveRouter = Router();

resolveRouter.post("/", authMiddleware, resolveMarket);
export default resolveRouter;
