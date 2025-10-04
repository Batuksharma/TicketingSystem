const express = require("express");
const dotenv = require("dotenv");
const ticketRoutes = require("./routes/ticketRoutes");
const cors = require("cors");

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Enable CORS
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5000"],
}));


// Parse incoming JSON data
app.use(express.json());

// Route handling
app.use("/", ticketRoutes);

// Define port
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
