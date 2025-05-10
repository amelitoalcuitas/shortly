import express from "express";
import {
  createUrl,
  getUrlByCode,
  redirectToUrl,
  getAllUrls,
  getUrlsByUser,
  deleteUrl,
  incrementUrlClickCount,
} from "../controllers/url-controller";

const router = express.Router();

// Create a new shortened URL
router.post("/", (req, res) => {
  createUrl(req, res);
});

// Get a shortened URL by its short code
router.get("/code/:code", (req, res) => {
  getUrlByCode(req, res);
});

// Redirect to the original URL
router.get("/redirect/:code", (req, res) => {
  redirectToUrl(req, res);
});

// Get all shortened URLs
router.get("/", (req, res) => {
  getAllUrls(req, res);
});

// Get shortened URLs by user ID
router.get("/user/:user_id", (req, res) => {
  getUrlsByUser(req, res);
});

// Increment the click count for a shortened URL
router.post("/increment/:code", (req, res) => {
  incrementUrlClickCount(req, res);
});

// Delete a shortened URL
router.delete("/:id", (req, res) => {
  deleteUrl(req, res);
});

export default router;
