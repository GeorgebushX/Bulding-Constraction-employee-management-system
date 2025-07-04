  import express from "express";
import {
  addClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  upload
} from "../Controllers/clientController.js";


import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/clients", upload,authMiddleware, addClient);
router.get("/clients",authMiddleware, getClients);
router.get("/clients/:id",authMiddleware, getClientById);
router.put("/clients/:id", upload,authMiddleware, updateClient);
router.delete("/clients/:id",authMiddleware, deleteClient);

export default router;
