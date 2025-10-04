const { ethers } = require("ethers");

// Utility function to parse amount to wei
const parseEther = (amount) => {
  return ethers.parseEther(amount.toString());
};

// Utility function to wait for a transaction to be mined
const waitForTransaction = async (tx) => {
  await tx.wait();
};

module.exports = {
  parseEther,
  waitForTransaction,
};
