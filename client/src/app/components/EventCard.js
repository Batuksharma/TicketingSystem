'use client';

import { useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';

// Assuming the contract ABI and address
const contractAddress = '0x...';  // Replace with your contract address
const contractABI = [
  // Your contract ABI here
];

const EventCard = ({ event }) => {
  const { address } = useAccount();
  const [ticketCount, setTicketCount] = useState(1);

  const { write: bookTicket } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'bookTicket',  // Replace with the actual function name
    args: [event.id, ticketCount],
    onSuccess: () => {
      alert("Ticket booked successfully!");
    },
  });

  const { write: deleteEvent } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'deleteEvent',  // Replace with actual function name
    args: [event.id],
    onSuccess: () => {
      alert("Event deleted successfully!");
    },
  });

  const handleTicketCountChange = (e) => {
    setTicketCount(Number(e.target.value));
  };

  return (
    <div className="event-card">
      <h3>{event.name}</h3>
      <p>Date: {event.date}</p>

      <button onClick={() => bookTicket()}>Book Ticket</button>

      {/* Only the creator can see the delete button */}
      {address === event.creator && (
        <button onClick={() => deleteEvent()}>Delete Event</button>
      )}

      {/* Ticket Count */}
      <input
        type="number"
        value={ticketCount}
        min="1"
        onChange={handleTicketCountChange}
      />
    </div>
  );
};

export default EventCard;
