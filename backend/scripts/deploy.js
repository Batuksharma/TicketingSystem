const hre = require("hardhat");
const ethers = hre.ethers;

async function main() {
  // Get the signers (accounts)
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Define the base URI for tickets
  const baseURI = "https://your-ticket-metadata-uri.com/";

  try {
    // Get the contract factory
    const TicketContract = await ethers.getContractFactory("Ticket");

    // Deploy the contract
    const ticket = await TicketContract.deploy(baseURI);

    // Wait for the contract to be mined and deployed
    const deployedTicket = await ticket.deployed();

    console.log("Ticket contract deployed to:", deployedTicket.address);

    // Optional: Verify the contract on Etherscan
    try {
      await hre.run("verify:verify", {
        address: deployedTicket.address,
        constructorArguments: [baseURI],
      });
    } catch (verifyError) {
      console.log("Contract verification failed:", verifyError);
    }

  } catch (error) {
    console.error("Deployment error:", error);
    process.exit(1);
  }
}

// Recommended pattern for handling async deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });