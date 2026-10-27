import { Router } from "express";
import {
  getProfile,
  getTransactions,
  onRamp,
  signIn,
  signUp,
} from "../controller/auth";
import { authMiddleware } from "../middleware/auth";

const authRouter = Router();

authRouter.post("/signup", signUp);
authRouter.post("/signin", signIn);

authRouter.post("/onramp", authMiddleware, onRamp);
authRouter.get("/profile", authMiddleware, getProfile);
authRouter.get("/transactions", authMiddleware, getTransactions);

export default authRouter;
