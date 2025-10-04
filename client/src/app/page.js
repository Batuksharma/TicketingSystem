"use client";

import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import EventMarketplace from "../app/components/EventMarketplace"; // Ensure this path is correct

const Page = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const handleConnect = async () => {
    try {
      if (connectors && connectors.length > 0) {
        await connect({ connector: connectors[0] });
      } else {
        console.error("No wallet connectors available");
      }
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Event Marketplace</h1>

      {!isConnected ? (
        <div className="text-center">
          <p className="mb-4">Please connect your wallet to see the events and tickets.</p>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            onClick={handleConnect}
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <EventMarketplace />
      )}
    </div>
  );
};

export default Page;
