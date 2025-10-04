const express = require("express");
const {
  createEvent,
  bookTicket,
  burnTicket,
  getOwnedTickets,
  getEventPaymentDetails,
  getTicketOwner,
  approveToken,
  deleteEvent
} = require("../controllers/ticketController");

const router = express.Router();

router.post("/createEvent", createEvent);
router.post("/bookTicket", bookTicket);
router.post("/burnTicket", burnTicket);
router.post("/deleteEvent", deleteEvent);
router.get("/getOwnedTickets", getOwnedTickets);
router.get("/getEventPaymentDetails/:eventId", getEventPaymentDetails);
router.get("/getTicketOwner/:eventId/:categoryId/:ticketNumber", getTicketOwner);
router.post("/approveToken", approveToken);

module.exports = router;
