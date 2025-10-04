const {
  createEventUtil,
  bookTicketUtil,
  burnTicketUtil,
  getOwnedTicketsUtil,
  getEventPaymentDetailsUtil,
  getTicketOwnerUtil,
  approveTokenUtil,
  deleteEventUtil,

} = require("../utils/ticketUtils");

// Create Event
const createEvent = async (req, res) => {
  try {
    await createEventUtil(req.body);
    res.json({ success: true, message: "Event created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book Ticket
const bookTicket = async (req, res) => {
  try {
    await bookTicketUtil(req.body);
    res.json({ success: true, message: "Ticket booked successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Burn Ticket
const burnTicket = async (req, res) => {
  try {
    await burnTicketUtil(req.body);
    res.json({ success: true, message: "Ticket burnt successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get Owned Tickets
const getOwnedTickets = async (req, res) => {
  try {
    const tickets = await getOwnedTicketsUtil(req.query);
    res.json({ success: true, tickets: tickets.length > 0 ? tickets : [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getEventPaymentDetails = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Fetch the token address (can be zero address, no error thrown)
    const tokenAddress = await getEventPaymentDetailsUtil(eventId);

    res.json({ success: true, token: tokenAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// Get Ticket Owner
const getTicketOwner = async (req, res) => {
  try {
    const owner = await getTicketOwnerUtil(req.params);
    res.json({ success: true, owner });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Approve ERC20 Token
const approveToken = async (req, res) => {
  try {
    await approveTokenUtil(req.body);
    res.json({ success: true, message: "Tokens approved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    await deleteEventUtil(req.body);
    res.json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createEvent,
  bookTicket,
  burnTicket,
  getOwnedTickets,
  getEventPaymentDetails,
  getTicketOwner,
  approveToken,
  deleteEvent,
};
