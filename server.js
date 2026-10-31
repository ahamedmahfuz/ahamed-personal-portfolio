
const express = require("express");
const mysql = require("mysql2");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// TiDB Cloud database connection
// Use the TiDB CA certificate to verify the TLS connection.
const caPath = path.join(__dirname, "isrgrootx1.pem");

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 4000),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "portfolio_db",

    ssl: {
        ca: fs.readFileSync(caPath),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

let databaseConnected = false;

// Check database connection
function checkDatabaseConnection() {
    db.query("SELECT 1", (err) => {
        if (err) {
            databaseConnected = false;
            console.error("TiDB connection failed:", err.message);
            return;
        }

        databaseConnected = true;
        console.log("TiDB Cloud Database Connected Successfully!");
    });
}

checkDatabaseConnection();

// Backend and database status
app.get("/api/status", (req, res) => {
    db.query("SELECT 1", (err) => {
        databaseConnected = !err;

        res.json({
            server: "running",
            database: databaseConnected
                ? "connected"
                : "disconnected"
        });
    });
});

// Get projects from database
app.get("/api/projects", (req, res) => {
    db.execute(
        "SELECT * FROM projects ORDER BY id DESC",
        (err, results) => {
            if (err) {
                console.error("Projects error:", err.message);

                return res.status(500).json({
                    error: "Unable to retrieve projects"
                });
            }

            res.json(results);
        }
    );
});

// Add a contact message
app.post("/api/messages", (req, res) => {
    const { name, email, message } = req.body;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof message !== "string" ||
        !name.trim() ||
        !email.trim() ||
        !message.trim() ||
        name.length > 100 ||
        email.length > 150 ||
        message.length > 5000
    ) {
        return res.status(400).json({
            error: "Please enter valid contact details."
        });
    }

    const sql = `
        INSERT INTO messages (name, email, message)
        VALUES (?, ?, ?)
    `;

    db.execute(
        sql,
        [name.trim(), email.trim(), message.trim()],
        (err) => {
            if (err) {
                console.error("Message error:", err.message);

                return res.status(500).json({
                    error: "Unable to save your message."
                });
            }

            res.status(201).json({
                success: true,
                message: "Your message was saved successfully!"
            });
        }
    );
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
