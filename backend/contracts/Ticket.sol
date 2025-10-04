// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Ticket is ERC1155, Ownable, ReentrancyGuard {
    
    struct Event {
        uint256 eventId;
        string name;
        string uri;
        string location;
        uint256[] categoryIds;
        uint256[] supplies;
        uint256[] prices; 
        address organizer;
        bool active;
    }
    
    uint256 public nextEventId = 1;
    
    mapping(uint256 => Event) public events;
    
    // Mapping to associate event with the selected payment token
    mapping(uint256 => address) public eventPaymentTokens;
    
    // Mapping for ticket ownership and burn status
    // eventId => categoryId => ticketNumber => owner
    mapping(uint256 => mapping(uint256 => mapping(uint256 => address))) public ticketOwners;
    
    // Mapping for burnt tickets
    // eventId => categoryId => ticketNumber => burnt status
    mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) public burntTickets;
    
    // Mapping to track if an address owns a specific ticket
    // categoryId => address => has been transferred
    mapping(uint256 => mapping(address => bool)) public hasBeenTransferred;
    
    // Events
    event EventCreated(uint256 indexed eventId, string name, address organizer);
    event TicketPurchased(uint256 indexed eventId, uint256 indexed categoryId, uint256 ticketNumber, address buyer);
    event TicketBurnt(uint256 indexed eventId, uint256 indexed categoryId, uint256 ticketNumber);
    event PaymentProcessed(uint256 indexed eventId, address indexed buyer, address indexed token, uint256 amount);
    event EthPaymentProcessed(uint256 indexed eventId, 
    address indexed buyer, address indexed recipient, uint256 amount);
  
    error CategorySupplyMismatch();
    error CategoryPriceMismatch();
    error InvalidPaymentToken();
    error EventNotActive();
    error CategoryNotFound();
    error InsufficientTickets();
    error InsufficientAllowance();
    error TokenTransferFailed();
    error NotTicketOwner();
    error TicketAlreadyBurnt();
    error TicketAlreadyTransferred();
    error InvalidPaymentAmount();
    error EthTransferFailed();
    error WrongPaymentMethod();
    error OnlyEventOrganizerCanDelete();
    error TicketsAlreadySold();
    error EventAlreadyInactive();

    constructor(string memory uri) ERC1155(uri) Ownable(msg.sender) {}
    
    function createEvent(
        string memory _name,
        string memory _uri,
        string memory _location,
        uint256[] memory _categoryIds,
        uint256[] memory _supplies,
        uint256[] memory _prices,
        address _paymentToken
     ) external nonReentrant {
        if (_categoryIds.length != _supplies.length) {
            revert CategorySupplyMismatch();
        }

        if (_categoryIds.length != _prices.length) {
            revert CategoryPriceMismatch();
        }

        uint256 eventId = nextEventId++;

        // Store event details
        events[eventId] = Event({
            eventId: eventId,
            name: _name,
            uri: _uri,
            location: _location,
            categoryIds: _categoryIds,
            supplies: _supplies,
            prices: _prices,
            organizer: msg.sender,
            active: true
        });

        // Store payment token (address(0) for ETH, otherwise ERC20 token address)
        eventPaymentTokens[eventId] = _paymentToken;

        emit EventCreated(eventId, _name, msg.sender);

        // Mint tickets after all state changes
        _mintBatch(msg.sender, _categoryIds, _supplies, "");
    }
    
    // Add receive function to accept ETH
    receive() external payable {}
    
    // Add fallback function to accept ETH
    fallback() external payable {}

    // Master payment function 
    function processPayment(
        uint256 eventId, 
        address buyer, 
        address recipient, 
        uint256 amount
       ) internal returns (bool) {
        // Get the payment token for this event
        address paymentToken = eventPaymentTokens[eventId];
        
        // Handle ETH payments (when paymentToken is address(0))
        if (paymentToken == address(0)) {
            // If ETH payment is expected but no ETH is sent, revert
            if (msg.value == 0) {
                revert InvalidPaymentAmount();
            }
            
            // Check that the correct amount of ETH was sent
            if (msg.value != amount) {
                revert InvalidPaymentAmount();
            }
            
            // Forward the ETH to the recipient
            (bool success, ) = recipient.call{value: amount}("");
            if (!success) {
                revert EthTransferFailed();
            }
            
            emit EthPaymentProcessed(eventId, buyer, recipient, amount);
            
            return true;
        } 
        // Handle ERC20 token payments
        else {
            // If ERC20 payment is expected but ETH is sent, revert with specific error
            if (msg.value > 0) {
                revert WrongPaymentMethod();
            }
            
            // Check if buyer has approved the contract to spend their tokens
            if (IERC20(paymentToken).allowance(buyer, address(this)) < amount) {
                revert InsufficientAllowance();
            }
            
            // Transfer tokens from buyer to recipient
            bool success = IERC20(paymentToken).transferFrom(buyer, recipient, amount);
            if (!success) {
                revert TokenTransferFailed();
            }
            emit PaymentProcessed(eventId, buyer, paymentToken, amount);
            
            return true;
        }
    }

    function bookTicket(uint256 eventId, uint256 categoryId, uint256 quantity) external payable nonReentrant {
        Event storage ev = events[eventId];
        
        // Check if the event is active
        if (!ev.active) {
            revert EventNotActive();
        }
        
        // Find the index of the category in the event
        uint256 categoryIndex;
        bool categoryFound = false;
        for (uint256 i = 0; i < ev.categoryIds.length; i++) {
            if (ev.categoryIds[i] == categoryId) {
                categoryIndex = i;
                categoryFound = true;
                break;
            }
        }
        if (!categoryFound) {
            revert CategoryNotFound();
        }
        
        // Calculate the total price
        uint256 totalPrice = ev.prices[categoryIndex] * quantity;
        
        // Check if organizer has enough tickets
        if (balanceOf(ev.organizer, categoryId) < quantity) {
            revert InsufficientTickets();
        }
        
        // ---- Effects: Update State Before External Calls ----
        uint256[] memory ticketNumbers = new uint256[](quantity);
        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketNumber = findNextAvailableTicketNumber(eventId, categoryId);
            ticketOwners[eventId][categoryId][ticketNumber] = msg.sender;
            hasBeenTransferred[categoryId][msg.sender] = true;
            ticketNumbers[i] = ticketNumber;
        }
        
        // Emit events after state updates
        for (uint256 i = 0; i < quantity; i++) {
            emit TicketPurchased(eventId, categoryId, ticketNumbers[i], msg.sender);
        }
        
        processPayment(eventId, msg.sender, ev.organizer, totalPrice);
        _safeTransferFrom(ev.organizer, msg.sender, categoryId, quantity, "");
    }

    function isEthPaymentEvent(uint256 eventId) public view returns (bool) {
        return eventPaymentTokens[eventId] == address(0);
    }
    
    function getEventPaymentDetails(uint256 eventId) public view returns (address token, bool isEth) {
        token = eventPaymentTokens[eventId];
        isEth = (token == address(0));
        return (token, isEth);
    }
    
    function findNextAvailableTicketNumber(uint256 eventId, uint256 categoryId) private view returns (uint256) {
        uint256 ticketNumber = 1;
        while (ticketOwners[eventId][categoryId][ticketNumber] != address(0)) {
            ticketNumber++;
        }
        return ticketNumber;
    }
    
    function burnTicket(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public nonReentrant {
        // Check if the caller is the ticket owner
        if (ticketOwners[eventId][categoryId][ticketNumber] != msg.sender) {
            revert NotTicketOwner();
        }
        
        // Check if the ticket has already been burnt
        if (burntTickets[eventId][categoryId][ticketNumber]) {
            revert TicketAlreadyBurnt();
        }
        
        // Mark ticket as burnt before burning
        burntTickets[eventId][categoryId][ticketNumber] = true;
        
        emit TicketBurnt(eventId, categoryId, ticketNumber);
        
        // Burn the token after all state updates
        _burn(msg.sender, categoryId, 1);
    }
    
    function isTicketBurnt(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public view returns (bool) {
        return burntTickets[eventId][categoryId][ticketNumber];
    }
    
    function getTicketOwner(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public view returns (address) {
        return ticketOwners[eventId][categoryId][ticketNumber];
    }
    
    function getOwnedTickets(uint256 eventId, 
        uint256 categoryId, 
        address owner) 
        public view returns (uint256[] memory) {
        // Count tickets owned by the address
        uint256 ticketCount = 0;
        Event storage ev = events[eventId];
        uint256 categoryIndex;
        for (uint256 i = 0; i < ev.categoryIds.length; i++) {
            if (ev.categoryIds[i] == categoryId) {
                categoryIndex = i;
                break;
            }
        }
        uint256 maxTickets = ev.supplies[categoryIndex]; // Reasonable upper limit for iteration
        
        for (uint256 i = 1; i <= maxTickets; i++) {
            if (ticketOwners[eventId][categoryId][i] == owner && !burntTickets[eventId][categoryId][i]) {
                ticketCount++;
            }
        }
        
        // Create result array
        uint256[] memory result = new uint256[](ticketCount);
        uint256 resultIndex = 0;
        
        // Fill result array
        for (uint256 i = 1; i <= maxTickets && resultIndex < ticketCount; i++) {
            if (ticketOwners[eventId][categoryId][i] == owner && !burntTickets[eventId][categoryId][i]) {
                result[resultIndex] = i;
                resultIndex++;
            }
        }
        
        return result;
    }

    function _beforeTokenTransfer(
        //address operator,
        address from,
        address to,
        uint256[] memory ids
        //uint256[] memory amounts,
        //bytes memory data
     ) internal view {
        // Allow minting (from == address(0)) and burning (to == address(0))
        if (from == address(0) || to == address(0)) {
            return;
        }
        
        // Check for each token ID
        for (uint256 i = 0; i < ids.length; i++) {
            uint256 categoryId = ids[i];
            
            // Find associated event
            bool isEventTicket = false;
            for (uint256 j = 1; j < nextEventId; j++) {
                for (uint256 k = 0; k < events[j].categoryIds.length; k++) {
                    if (events[j].categoryIds[k] == categoryId) {
                        isEventTicket = true;
                        
                        // Allow transfer from organizer to buyer (initial purchase)
                        if (from == events[j].organizer) {
                            break;
                        }
                        
                        // Prevent transfers after initial purchase
                        if (hasBeenTransferred[categoryId][from]) {
                            revert TicketAlreadyTransferred();
                        }
                        break;
                    }
                }
                if (isEventTicket) break;
            }
        }
    }
    event EventDeleted(uint256 indexed eventId, address indexed organizer);

    function deleteEvent(uint256 eventId) external nonReentrant {
        // Check that the caller is the event organizer
        if (events[eventId].organizer != msg.sender) {
            revert OnlyEventOrganizerCanDelete();
        }

        // Check if the event is already inactive
        if (!events[eventId].active) {
            revert EventAlreadyInactive();
        }

        // Check that no tickets have been sold
        for (uint256 i = 0; i < events[eventId].categoryIds.length; i++) {
            uint256 categoryId = events[eventId].categoryIds[i];
            uint256 remainingSupply = balanceOf(msg.sender, categoryId);
            
            // Check that all tickets are still with the organizer
            if (remainingSupply != events[eventId].supplies[i]) {
                revert TicketsAlreadySold();
            }
        }

        // Mark event as inactive
        events[eventId].active = false;

        // Burn all unsold tickets
        uint256[] memory categoryIds = events[eventId].categoryIds;
        uint256[] memory supplies = events[eventId].supplies;
        _burnBatch(msg.sender, categoryIds, supplies);

        // Remove payment token association
        delete eventPaymentTokens[eventId];

        // Emit event deletion event
        emit EventDeleted(eventId, msg.sender);
    }

    function getEventDetails(uint256 eventId) public view returns (
        string memory name,
        string memory uri,
        string memory location,
        address organizer,
        bool active
        ) {
        // Check if event exists (implicitly by checking if eventId is less than nextEventId)
        require(eventId > 0 && eventId < nextEventId, "Event does not exist");
        
        Event storage ev = events[eventId];
        
        return (
            ev.name,
            ev.uri,
            ev.location,
            ev.organizer,
            ev.active
        );
    }

    // New function to get event category details
    function getEventCategories(uint256 eventId) public view returns (
        uint256[] memory categoryIds,
        uint256[] memory supplies,
        uint256[] memory prices
        ) {
        // Check if event exists
        require(eventId > 0 && eventId < nextEventId, "Event does not exist");
        
        Event storage ev = events[eventId];
        
        return (
            ev.categoryIds,
            ev.supplies,
            ev.prices
        );
    }

    // Function to get payment token for an event
    function getEventPaymentToken(uint256 eventId) public view returns(address){
        // Check if event exists
        require(eventId > 0 && eventId < nextEventId, "Event does not exist");
        
        return eventPaymentTokens[eventId];
    }
}

