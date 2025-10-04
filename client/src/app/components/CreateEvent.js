'use client';

import { useState } from 'react';
import { useAccount, useContractWrite } from 'wagmi';
import { ethers } from 'ethers';

// Assuming the contract ABI and address
const contractAddress = '0x...';  // Replace with your contract address
const contractABI = [
  // Your contract ABI here
];

const CreateEvent = () => {
  const { address } = useAccount();
  const [eventDetails, setEventDetails] = useState({
    name: '',
    date: '',
    image: '',
  });
  const { write: createEvent } = useContractWrite({
    address: contractAddress,
    abi: contractABI,
    functionName: 'createEvent',  // Replace with the actual function name in your contract
    args: [eventDetails.name, eventDetails.date, eventDetails.image],
    onSuccess: () => {
      alert("Event created successfully!");
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventDetails((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    createEvent();
  };

  return (
    <div>
      <h2>Create Event</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Event Name:</label>
          <input
            type="text"
            name="name"
            value={eventDetails.name}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Event Date:</label>
          <input
            type="date"
            name="date"
            value={eventDetails.date}
            onChange={handleInputChange}
            required
          />
        </div>
        <div>
          <label>Event Image URL:</label>
          <input
            type="text"
            name="image"
            value={eventDetails.image}
            onChange={handleInputChange}
            required
          />
        </div>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default CreateEvent;
