const { contract, signer } = require("../services/etherService");
const { parseEther, waitForTransaction } = require("./etherUtils");
const { ethers } = require("ethers");

// Create Event
const createEventUtil = async (data) => {
  const { name, uri, location, categoryIds, supplies, prices, paymentToken } = data;

  const tx = await contract.createEvent(
    name,
    uri,
    location,
    categoryIds,
    supplies,
    prices,
    paymentToken
  );
  await waitForTransaction(tx);
};

// Book Ticket
const bookTicketUtil = async (data) => {
  const { eventId, categoryId, quantity, amount } = data;

  const tx = await contract.connect(signer).bookTicket(eventId, categoryId, quantity, {
    value: parseEther(amount),
  });
  await waitForTransaction(tx);
};

// Burn Ticket
const burnTicketUtil = async (data) => {
  const { eventId, categoryId, ticketNumber } = data;

  const tx = await contract.burnTicket(eventId, categoryId, ticketNumber);
  await waitForTransaction(tx);
};

// Get Owned Tickets
const getOwnedTicketsUtil = async (params) => {
  const { eventId, categoryId, owner } = params;
  const ticketNumbers = await contract.getOwnedTickets(eventId, categoryId, owner);

  return ticketNumbers.map((ticket) => (ticket ? ticket.toString() : "0"));
};

// Get Event Payment Details

const getEventPaymentDetailsUtil = async (eventId) => {
  try {
    console.log("Fetching event data for Event ID:", eventId);

    // Fetch event data from events mapping
    const eventData = await contract.events(eventId);
    console.log("Event Data:", eventData);

    // Check if the event exists and is active
    if (!eventData.active) {
      throw new Error("Event does not exist or is inactive.");
    }

    // Fetch payment token without throwing error if zero address
    const tokenAddress = await contract.eventPaymentTokens(eventId);
    console.log("Token Address:", tokenAddress);

    // Return the token address, even if it’s a zero address
    return tokenAddress;
  } catch (error) {
    console.error("Error fetching event payment details:", error.message);
    throw error;
  }
};

// Get Ticket Owner
const getTicketOwnerUtil = async (params) => {
  const { eventId, categoryId, ticketNumber } = params;
  return await contract.getTicketOwner(eventId, categoryId, ticketNumber);
};

// Approve ERC20 Token
const approveTokenUtil = async (data) => {
  const { tokenAddress, amount } = data;

  const tokenABI = [
    "function approve(address spender, uint256 amount) public returns (bool)",
  ];
  const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);

  const amountToApprove = ethers.parseUnits(amount.toString(), 18);
  const tx = await tokenContract.approve(contract.target, amountToApprove);
  await waitForTransaction(tx);
};

const deleteEventUtil = async ({ eventId }) => {
  const tx = await contract.deleteEvent(eventId);
  await tx.wait();
};

module.exports = {
  createEventUtil,
  bookTicketUtil,
  burnTicketUtil,
  getOwnedTicketsUtil,
  getEventPaymentDetailsUtil,
  getTicketOwnerUtil,
  approveTokenUtil,
  deleteEventUtil
};
