'use client';

import { useAccount, useContractRead } from 'wagmi';

const contractAddress = '0x...';  // Replace with your contract address
const contractABI = [
  // Your contract ABI here
];

const GetOwnedTickets = () => {
  const { address } = useAccount();

  const { data: ownedTickets, isLoading } = useContractRead({
    address: contractAddress,
    abi: contractABI,
    functionName: 'getOwnedTickets',  // Replace with actual function name
    args: [address],
  });

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h2>Your Tickets</h2>
      {ownedTickets.length === 0 ? (
        <p>No tickets owned</p>
      ) : (
        ownedTickets.map((ticket, index) => (
          <div key={index} className="ticket-card">
            <h3>{ticket.eventName}</h3>
            <p>Category: {ticket.category}</p>
            <p>Ticket Number: {ticket.ticketNumber}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default GetOwnedTickets;
