"use client";
// Updated imports
import { useState, useEffect } from "react";
import { 
  useAccount, 
  useReadContract, 
  useWriteContract, 
  useWatchContractEvent,
  useBalance 
} from "wagmi";
import { parseEther } from "viem";
import { toast } from "react-toastify";
import contractAbi from "../abi/Ticket.json";

const CONTRACT_ADDRESS = "0x4D9744d6456080954e07Ddf733B4C39748d5B282";

export default function EventMarketplace() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ownedTickets, setOwnedTickets] = useState([]);
  const [isBuying, setIsBuying] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [burnData, setBurnData] = useState({
    eventId: "",
    categoryId: "",
    ticketNumber: ""
  });
  const [activeView, setActiveView] = useState("events");
  
  // New event form state
  const [newEvent, setNewEvent] = useState({
    name: "",
    uri: "",
    location: "",
    categoryIds: ["1"],
    supplies: ["100"],
    prices: ["0.01"],
    paymentToken: "0x0000000000000000000000000000000000000000" // ETH payment by default
  });

 // Get address from wagmi
const { address, isConnected } = useAccount();

// Fetch balance for the connected wallet
const { data: balance } = useBalance({
  address,
  enabled: isConnected,
});

// Get the next event ID to know how many events exist
const { data: nextEventId, refetch: refetchEventCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "nextEventId",
    enabled: isConnected,
  });

  // Create event function
  const { data: createEventData, write: createEvent } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "createEvent",
  });

  // Wait for create event transaction
  const { isLoading: isCreatingEvent } = useWaitForTransactionReceipt({
    hash: createEventData?.hash,
    onSuccess() {
      toast.success("Event created successfully!");
      refetchEventCount();
      fetchEvents();
      setIsCreating(false);
      resetNewEventForm();
    },
    onError(error) {
      toast.error(error.message || "Failed to create event");
      setIsCreating(false);
    },
  });

  // Book ticket function
  const { data: bookTicketData, write: bookTicket } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "bookTicket",
  });

  // Wait for book ticket transaction
  const { isLoading: isBookingTicket } = useWaitForTransactionReceipt({
    hash: bookTicketData?.hash,
    onSuccess() {
      toast.success("Ticket purchased successfully!");
      fetchUserTickets();
      setIsBuying(false);
      setSelectedEventId(null);
      setSelectedCategoryId(null);
      setTicketQuantity(1);
    },
    onError(error) {
      toast.error(error.message || "Transaction failed");
      setIsBuying(false);
    },
  });

  // Delete event function
  const { data: deleteEventData, write: deleteEvent } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "deleteEvent",
  });

  // Wait for delete event transaction
  const { isLoading: isDeletingEvent } = useWaitForTransactionReceipt({
    hash: deleteEventData?.hash,
    onSuccess() {
      toast.success("Event deleted successfully!");
      refetchEventCount();
      fetchEvents();
      setIsDeleting(false);
    },
    onError(error) {
      toast.error(error.message || "Failed to delete event");
      setIsDeleting(false);
    },
  });
  // Burn ticket function
  const { data: burnTicketData, write: burnTicket } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: contractAbi,
    functionName: "burnTicket",
  });

  // Wait for burn ticket transaction
  const { isLoading: isBurningTicket } = useWaitForTransactionReceipt({
    hash: burnTicketData?.hash,
    onSuccess() {
      toast.success("Ticket burned successfully!");
      fetchUserTickets();
      setIsBurning(false);
      setBurnData({ eventId: "", categoryId: "", ticketNumber: "" });
    },
    onError(error) {
      toast.error(error.message || "Failed to burn ticket");
      setIsBurning(false);
    },
  });

  // Function to handle form input changes for event creation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  // Function to handle array input changes for event creation
  const handleArrayInputChange = (e, index, arrayName) => {
    const { value } = e.target;
    const updatedArray = [...newEvent[arrayName]];
    updatedArray[index] = value;
    setNewEvent({ ...newEvent, [arrayName]: updatedArray });
  };

  // Function to add another category to the event
  const addCategory = () => {
    setNewEvent({
      ...newEvent,
      categoryIds: [...newEvent.categoryIds, (newEvent.categoryIds.length + 1).toString()],
      supplies: [...newEvent.supplies, "100"],
      prices: [...newEvent.prices, "0.01"]
    });
  };

  // Function to remove a category
  const removeCategory = (index) => {
    if (newEvent.categoryIds.length <= 1) return;
    
    const updatedCategoryIds = [...newEvent.categoryIds];
    const updatedSupplies = [...newEvent.supplies];
    const updatedPrices = [...newEvent.prices];
    
    updatedCategoryIds.splice(index, 1);
    updatedSupplies.splice(index, 1);
    updatedPrices.splice(index, 1);
    
    setNewEvent({
      ...newEvent,
      categoryIds: updatedCategoryIds,
      supplies: updatedSupplies,
      prices: updatedPrices
    });
  };

  // Reset event creation form
  const resetNewEventForm = () => {
    setNewEvent({
      name: "",
      uri: "",
      location: "",
      categoryIds: ["1"],
      supplies: ["100"],
      prices: ["0.01"],
      paymentToken: "0x0000000000000000000000000000000000000000"
    });
  };

  // Function to handle event creation
  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.uri || !newEvent.location) {
      toast.error("Please fill in all required fields");
      return;
    }
  
    try {
      setIsCreating(true);
      
      // Convert string arrays to appropriate types
      const categoryIds = newEvent.categoryIds.map(id => BigInt(id));
      const supplies = newEvent.supplies.map(supply => BigInt(supply));
      const prices = newEvent.prices.map(price => parseEther(price));
      
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "createEvent",
        args: [
          newEvent.name,
          newEvent.uri,
          newEvent.location,
          categoryIds,
          supplies,
          prices,
          newEvent.paymentToken
        ],
      });
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
      setIsCreating(false);
    }
  };
  // Function to handle ticket booking
  const handleBookTicket = (eventId, categoryId, quantity) => {
    try {
      setIsBuying(true);
      setSelectedEventId(eventId);
      setSelectedCategoryId(categoryId);
      
      // Get event details to calculate price
      const event = events.find(e => e.id === eventId);
      if (!event) {
        toast.error("Event not found");
        setIsBuying(false);
        return;
      }
      
      const categoryIndex = event.categoryIds.findIndex(id => id === categoryId);
      if (categoryIndex === -1) {
        toast.error("Category not found");
        setIsBuying(false);
        return;
      }
      
      const price = event.prices[categoryIndex];
      const totalPrice = BigInt(price) * BigInt(quantity);
      
      const isEthPayment = event.paymentToken === "0x0000000000000000000000000000000000000000";
      
      // Call the bookTicket function
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName: "bookTicket",
        args: [
          BigInt(eventId),
          BigInt(categoryId),
          BigInt(quantity)
        ],
        value: isEthPayment ? totalPrice : 0n,
      });
    } catch (error) {
      console.error("Error booking ticket:", error);
      toast.error("Failed to book ticket");
      setIsBuying(false);
    }
  };

  // Function to handle event deletion
  const handleDeleteEvent = (eventId) => {
    try {
      setIsDeleting(true);
      deleteEvent({ args: [BigInt(eventId)] });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
      setIsDeleting(false);
    }
  };

  // Function to handle burn data input changes
  const handleBurnDataChange = (e) => {
    const { name, value } = e.target;
    setBurnData({ ...burnData, [name]: value });
  };

  // Function to handle ticket burning
  const handleBurnTicket = () => {
    if (!burnData.eventId || !burnData.categoryId || !burnData.ticketNumber) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsBurning(true);
      burnTicket({ 
        args: [
          BigInt(burnData.eventId),
          BigInt(burnData.categoryId),
          BigInt(burnData.ticketNumber)
        ] 
      });
    } catch (error) {
      console.error("Error burning ticket:", error);
      toast.error("Failed to burn ticket");
      setIsBurning(false);
    }
  };

  // Fetch all events
  const fetchEvents = async () => {
    if (!nextEventId || !isConnected) return;
    
    setLoading(true);
    try {
      const fetchedEvents = [];
      // Start from 1 since event IDs are 1-indexed
      for (let i = 1; i < Number(nextEventId); i++) {
        try {
          // Get base event details
          const eventDetails = await readContract(i, "getEventDetails");
          if (!eventDetails) continue;
          
          // Get event categories
          const eventCategories = await readContract(i, "getEventCategories");
          if (!eventCategories) continue;
          
          // Get payment token
          const paymentToken = await readContract(i, "getEventPaymentToken");
          
          // Format event data
          const event = {
            id: i,
            name: eventDetails[0],
            uri: eventDetails[1],
            location: eventDetails[2],
            organizer: eventDetails[3],
            active: eventDetails[4],
            categoryIds: eventCategories[0].map(id => Number(id)),
            supplies: eventCategories[1].map(supply => Number(supply)),
            prices: eventCategories[2].map(price => price.toString()),
            paymentToken
          };
          
          if (event.active) {
            fetchedEvents.push(event);
          }
        } catch (error) {
          console.error(`Failed to fetch event ${i}:`, error);
        }
      }
      setEvents(fetchedEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      toast.error("Failed to fetch events");
    }
    setLoading(false);
  };

  // Helper function to read contract data
  // Helper function to read contract data
const readContract = async (eventId, functionName) => {
    try {
      // Updated approach using API or direct contract call
      const client = createPublicClient({
        chain: mainnet,
        transport: http()
      });
      
      const data = await client.readContract({
        address: CONTRACT_ADDRESS,
        abi: contractAbi,
        functionName,
        args: [BigInt(eventId)]
      });
  
      return data;
    } catch (error) {
      console.error(`Error reading contract (${functionName}):`, error);
      return null;
    }
  };

  // Fetch user's owned tickets
  const fetchUserTickets = async () => {
    if (!address || !isConnected || !events.length) return;
    
    try {
      const userOwnedTickets = [];
      
      // For each event, check all categories
      for (const event of events) {
        for (const categoryId of event.categoryIds) {
          try {
            // Get ticket numbers owned by user for this event and category
            const response = await fetch(`/api/contract?function=getOwnedTickets&eventId=${event.id}&categoryId=${categoryId}&owner=${address}`);
            if (!response.ok) continue;
            
            const data = await response.json();
            const ticketNumbers = data.result;
            
            // If user owns tickets in this category
            if (ticketNumbers && ticketNumbers.length > 0) {
              for (const ticketNumber of ticketNumbers) {
                userOwnedTickets.push({
                  eventId: event.id,
                  eventName: event.name,
                  categoryId,
                  ticketNumber: Number(ticketNumber),
                  uri: event.uri
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching tickets for event ${event.id}, category ${categoryId}:`, error);
          }
        }
      }
      
      setOwnedTickets(userOwnedTickets);
    } catch (error) {
      console.error("Failed to fetch user tickets:", error);
    }
  };

  // Initialize
  useEffect(() => {
    // Handle transaction results
    if (isWriteSuccess) {
      // Different success handlers based on which function was called
      if (writeData) {
        // You might need to check the data to determine which operation succeeded
        // For example, by checking parameters passed or transaction data
        
        // General success handler
        toast.success("Transaction successful!");
        
        // Reset loading states
        setIsCreating(false);
        setIsBuying(false);
        setIsDeleting(false);
        setIsBurning(false);
        
        // Refresh data
        fetchEvents();
        fetchUserTickets();
      }
    }
    
    if (writeError) {
      toast.error(writeError.message || "Transaction failed");
      // Reset loading states
      setIsCreating(false);
      setIsBuying(false);
      setIsDeleting(false);
      setIsBurning(false);
    }
  }, [isWriteSuccess, writeError, writeData]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <p className="font-medium">Connected: {address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ''}</p>
        <p className="font-medium">Balance: {balance ? `${balance.formatted} ${balance.symbol}` : 'Loading...'}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b mb-6">
        <button 
          className={`py-2 px-4 font-medium ${activeView === 'events' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveView('events')}
        >
          Available Events
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeView === 'myTickets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveView('myTickets')}
        >
          My Tickets
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeView === 'createEvent' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveView('createEvent')}
        >
          Create Event
        </button>
        <button 
          className={`py-2 px-4 font-medium ${activeView === 'burnTicket' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveView('burnTicket')}
        >
          Burn Ticket
        </button>
      </div>

      {/* Events View */}
      {activeView === 'events' && (
        <>
          <h2 className="text-xl font-bold my-4">Available Events</h2>
          {loading ? (
            <p className="text-center">Loading events...</p>
          ) : events && events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {events.map((event) => (
                <div key={event.id} className="border p-4 rounded-lg shadow-lg">
                  <h2 className="text-xl font-semibold">{event.name}</h2>
                  <p className="mt-2"><strong>Location:</strong> {event.location}</p>
                  <p className="mt-2"><strong>URI:</strong> {event.uri}</p>
                  <p className="mt-2 text-gray-700"><strong>Organizer:</strong> {`${event.organizer.substring(0, 6)}...${event.organizer.substring(event.organizer.length - 4)}`}</p>
                  
                  <div className="mt-4">
                    <h3 className="font-medium">Available Categories:</h3>
                    <div className="mt-2 space-y-2">
                      {event.categoryIds.map((categoryId, index) => {
                        const supply = event.supplies[index];
                        const price = event.prices[index];
                        return (
                          <div key={categoryId} className="border-t pt-2">
                            <p><strong>Category ID:</strong> {categoryId}</p>
                            <p><strong>Supply:</strong> {supply}</p>
                            <p><strong>Price:</strong> {parseFloat(price) / (10 ** 18)} ETH</p>
                            
                            <div className="flex items-center space-x-2 mt-2">
                              <input
                                type="number"
                                min="1"
                                max={supply}
                                value={selectedEventId === event.id && selectedCategoryId === categoryId ? ticketQuantity : 1}
                                onChange={(e) => setTicketQuantity(parseInt(e.target.value))}
                                className="w-20 px-2 py-1 border rounded"
                                disabled={isBuying}
                              />
                              <button
                                className={`bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded ${isBuying || isBookingTicket ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => {
                                  if (!isBuying && !isBookingTicket) {
                                    handleBookTicket(event.id, categoryId, ticketQuantity);
                                  }
                                }}
                                disabled={isBuying || isBookingTicket}
                              >
                                {(isBuying || isBookingTicket) && selectedEventId === event.id && selectedCategoryId === categoryId ? 'Booking...' : 'Book'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delete Event Button (only show if user is the organizer) */}
                  {event.organizer.toLowerCase() === address?.toLowerCase() && (
                    <div className="mt-4 border-t pt-4">
                      <button
                        className={`bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded w-full ${isDeleting || isDeletingEvent ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => {
                          if (!isDeleting && !isDeletingEvent) {
                            handleDeleteEvent(event.id);
                          }
                        }}
                        disabled={isDeleting || isDeletingEvent}
                      >
                        {isDeleting || isDeletingEvent ? 'Deleting...' : 'Delete Event'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p>No events available</p>
          )}
        </>
      )}

      {/* My Tickets View */}
      {activeView === 'myTickets' && (
        <>
          <h2 className="text-xl font-bold my-4">Your Tickets</h2>
          {ownedTickets && ownedTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownedTickets.map((ticket, index) => (
                <div key={index} className="border p-4 rounded-lg shadow-md bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{ticket.eventName}</h3>
                      <p className="text-gray-700 mt-1">Event #{ticket.eventId}</p>
                    </div>
                    <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                      NFT Ticket
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded-lg shadow-inner">
                    <p><strong>Category ID:</strong> {ticket.categoryId}</p>
                    <p><strong>Ticket Number:</strong> {ticket.ticketNumber}</p>
                    <p className="truncate"><strong>URI:</strong> {ticket.uri}</p>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-600">Valid Ticket</span>
                    </div>
                    
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => {
                        setBurnData({
                          eventId: ticket.eventId,
                          categoryId: ticket.categoryId,
                          ticketNumber: ticket.ticketNumber
                        });
                        setActiveView('burnTicket');
                      }}
                    >
                      Burn Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No tickets owned</p>
          )}
        </>
      )}

      {/* Create Event View */}
      {activeView === 'createEvent' && (
        <>
          <h2 className="text-xl font-bold my-4">Create New Event</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Event Name *</label>
              <input
                type="text"
                name="name"
                value={newEvent.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter event name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">URI (Metadata location) *</label>
              <input
                type="text"
                name="uri"
                value={newEvent.uri}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="https://example.com/event-metadata.json"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Location *</label>
              <input
                type="text"
                name="location"
                value={newEvent.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter event location"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Payment Token</label>
              <select
                name="paymentToken"
                value={newEvent.paymentToken}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="0x0000000000000000000000000000000000000000">ETH</option>
                {/* Add other token options here if needed */}
              </select>
              <p className="text-sm text-gray-500 mt-1">Default is ETH payment</p>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700">Ticket Categories</label>
                <button
                  type="button"
                  onClick={addCategory}
                  className="text-blue-500 hover:text-blue-700"
                >
                  + Add Category
                </button>
              </div>
              
              {newEvent.categoryIds.map((categoryId, index) => (
                <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium">Category #{index + 1}</h4>
                    {newEvent.categoryIds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Category ID</label>
                      <input
                        type="number"
                        value={categoryId}
                        onChange={(e) => handleArrayInputChange(e, index, 'categoryIds')}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="1"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Supply</label>
                      <input
                        type="number"
                        value={newEvent.supplies[index]}
                        onChange={(e) => handleArrayInputChange(e, index, 'supplies')}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="100"
                        min="1"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Price (ETH)</label>
                      <input
                        type="number"
                        value={newEvent.prices[index]}
                        onChange={(e) => handleArrayInputChange(e, index, 'prices')}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="0.01"
                        step="0.001"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              className={`w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg ${isCreating || isCreatingEvent ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleCreateEvent}
              disabled={isCreating || isCreatingEvent}
            >
              {isCreating || isCreatingEvent ? 'Creating Event...' : 'Create Event'}
            </button>
          </div>
        </>
      )}

      {/* Burn Ticket View */}
      {activeView === 'burnTicket' && (
        <>
          <h2 className="text-xl font-bold my-4">Burn Ticket</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Event ID *</label>
              <input
                type="number"
                name="eventId"
                value={burnData.eventId}
                onChange={handleBurnDataChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter event ID"
                min="1"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Category ID *</label>
              <input
                type="number"
                name="categoryId"
                value={burnData.categoryId}
                onChange={handleBurnDataChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter category ID"
                min="1"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Ticket Number *</label>
              <input
                type="number"
                name="ticketNumber"
                value={burnData.ticketNumber}
                onChange={handleBurnDataChange}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Enter ticket number"
                min="1"
                required
              />
            </div>
            
            <button
              className={`w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg ${isBurning || isBurningTicket ? 'cursor-not-allowed opacity-50' : ''}`}
              onClick={handleBurnTicket}
              disabled={isBurning || isBurningTicket}
            >
              {isBurning || isBurningTicket ? 'Burning Ticket...' : 'Burn Ticket'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}