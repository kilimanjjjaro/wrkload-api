import { Router } from "express";

const router = Router();

router.get("/", (_, res) => { res.send('ok'); });

export default router;
