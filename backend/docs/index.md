# Solidity API

## Ticket

### paymentToken

```solidity
contract IERC20 paymentToken
```

### Event

```solidity
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
```

### nextEventId

```solidity
uint256 nextEventId
```

### events

```solidity
mapping(uint256 => struct Ticket.Event) events
```

### ticketOwners

```solidity
mapping(uint256 => mapping(uint256 => mapping(uint256 => address))) ticketOwners
```

### burntTickets

```solidity
mapping(uint256 => mapping(uint256 => mapping(uint256 => bool))) burntTickets
```

### hasBeenTransferred

```solidity
mapping(uint256 => mapping(address => bool)) hasBeenTransferred
```

### EventCreated

```solidity
event EventCreated(uint256 eventId, string name, address organizer)
```

### TicketPurchased

```solidity
event TicketPurchased(uint256 eventId, uint256 categoryId, uint256 ticketNumber, address buyer)
```

### TicketBurnt

```solidity
event TicketBurnt(uint256 eventId, uint256 categoryId, uint256 ticketNumber)
```

### constructor

```solidity
constructor(string uri, address _paymentToken) public
```

### setPaymentToken

```solidity
function setPaymentToken(address _paymentToken) external
```

### createEvent

```solidity
function createEvent(string _name, string _uri, string _location, uint256[] _categoryIds, uint256[] _supplies, uint256[] _prices) public
```

### bookTicket

```solidity
function bookTicket(uint256 eventId, uint256 categoryId, uint256 quantity) public
```

### burnTicket

```solidity
function burnTicket(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public
```

### isTicketBurnt

```solidity
function isTicketBurnt(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public view returns (bool)
```

### getTicketOwner

```solidity
function getTicketOwner(uint256 eventId, uint256 categoryId, uint256 ticketNumber) public view returns (address)
```

### getOwnedTickets

```solidity
function getOwnedTickets(uint256 eventId, uint256 categoryId, address owner) public view returns (uint256[])
```

### _beforeTokenTransfer

```solidity
function _beforeTokenTransfer(address from, address to, uint256[] ids) internal view
```

