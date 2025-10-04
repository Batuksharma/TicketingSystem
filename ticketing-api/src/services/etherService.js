const { ethers } = require("ethers");
const { abi } = require("../constants/abi");
require("dotenv").config();

// Load environment variables
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

// Connect to provider and signer
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Load contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

module.exports = {
  contract,
  signer: wallet,
};
