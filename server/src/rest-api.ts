import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv.config();

const app = express();
import { db } from "./db/knex";
import urlRoutes from "./routes/url-routes";
import authRoutes from "./routes/auth-routes";

//middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true, // Allow cookies to be sent with requests
  })
);
app.use(express.json());
app.use(cookieParser());

/*
##################################################
||                                              ||
||              Example endpoints               ||
||                                              ||
##################################################
*/

// Root endpoint - Automatically redirects to the client application
app.get("/", (_req, res) => {
  res.redirect(process.env.CLIENT_URL || "http://localhost:3000");
});

// GET /examples - Fetches all records from the example_foreign_table
app.get("/examples", async (_req, res) => {
  const docs = await db("example_foreign_table").select("*");
  res.json({ docs });
});

// POST /examples - Creates a new record with auth method and name, returns the created document
app.post("/examples", async (req, res) => {
  const { authMethod, name } = req.body;
  const [doc] = await db("example_foreign_table")
    .insert({
      authMethod,
      name,
    })
    .returning("*");
  res.json({ doc });
});

// URL shortening routes
app.use("/api/urls", urlRoutes);

// User authentication routes
app.use("/api/auth", authRoutes);

// Direct URL shortening access - This should be placed after all other routes
// to avoid conflicts with other routes
import { redirectToUrl } from "./controllers/url-controller";
app.get("/:code", (req, res) => {
  // Pass the request to the redirectToUrl controller
  redirectToUrl(req, res);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`server has started on port ${PORT}`);
});
