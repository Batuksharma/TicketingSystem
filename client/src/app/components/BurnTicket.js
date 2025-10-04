'use client';

import { useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';

const contractAddress = '0x...';  // Replace with your contract address
const contractABI = [
  // Your contract ABI here
];

const BurnTicket = () => {
  const { address } = useAccount();
  const [ticketDetails, setTicketDetails] = useState({
    eventName: '',
    category: '',
    ticketNumber: '',
  });

  const { write: burnTicket } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'burnTicket',  // Replace with the actual function name
    args: [ticketDetails.eventName, ticketDetails.category, ticketDetails.ticketNumber],
    onSuccess: () => {
      alert("Ticket burned successfully!");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTicketDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    burnTicket();
  };

  return (
    <div>
      <h2>Burn Ticket</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Event Name:</label>
          <input
            type="text"
            name="eventName"
            value={ticketDetails.eventName}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Category:</label>
          <input
            type="text"
            name="category"
            value={ticketDetails.category}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Ticket Number:</label>
          <input
            type="text"
            name="ticketNumber"
            value={ticketDetails.ticketNumber}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Burn Ticket</button>
      </form>
    </div>
  );
};

export default BurnTicket;
