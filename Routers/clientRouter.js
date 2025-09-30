  import express from "express";
import {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  deleteAllClients,
  deleteClient_site,
  deleteAllClients_site,
  upload
} from "../Controllers/clientController.js";


import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/clients", upload,authMiddleware, createClient);
router.get("/clients",authMiddleware, getAllClients);
router.get("/clients/:id",authMiddleware, getClientById);
router.put("/clients/:id", upload,authMiddleware, updateClient);
router.delete("/clients/:id",authMiddleware, deleteClient);
router.delete("/clients",authMiddleware, deleteAllClients);
router.delete("/client_site/:id",authMiddleware, deleteClient_site);
router.delete("/clients",authMiddleware, deleteAllClients_site);

export default router;
