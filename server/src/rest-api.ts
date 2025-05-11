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

// Root endpoint - Returns a simple landing page for the URL shortener
app.get("/", async (_req, res) => {
  res.send(`
    <html>
      <head>
        <title>shortly - URL shortener</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            max-width: 600px;
          }
          h1 {
            color: #ff0054;
            margin-bottom: 1rem;
          }
          p {
            color: #333;
            margin-bottom: 1.5rem;
          }
          .button {
            display: inline-block;
            background-color: #ff0054;
            color: white;
            padding: 0.75rem 1.5rem;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            margin: 0.5rem;
          }
          .button:hover {
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Shortly</h1>
          <p>Welcome to shortly, a simple URL shortener service.</p>
          <p>This is the API server. To use the URL shortener, please visit the client application.</p>
          <div>
            <a href="${
              process.env.CLIENT_URL || "http://localhost:3000"
            }" class="button">Go to Client App</a>
          </div>
        </div>
      </body>
    </html>
  `);
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
