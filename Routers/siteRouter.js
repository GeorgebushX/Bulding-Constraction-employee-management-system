import express from "express";
import {
  addSite,
  getSites,
  getSiteById,
  updateSite,
  deleteSite,
  upload
} from "../Controllers/siteController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/site",upload,authMiddleware, addSite);
router.get("/site",authMiddleware, getSites);
router.get("/site/:id",authMiddleware, getSiteById);
router.put("/site/:id", upload,authMiddleware, updateSite);
router.delete("/site/:id",authMiddleware, deleteSite);

export default router;
