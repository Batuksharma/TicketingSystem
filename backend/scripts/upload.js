require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const pinFileToIPFS = async (filePath) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;

  let data = new FormData();
  data.append('file', fs.createReadStream(filePath));

  const res = await axios.post(url, data, {
    headers: {
      'Content-Type': `multipart/form-data`,
      'pinata_api_key': process.env.PINATA_API_KEY,
      'pinata_secret_api_key': process.env.PINATA_SECRET_API_KEY,
    },
  });

  console.log(`File uploaded to IPFS: https://gateway.pinata.cloud/ipfs/${res.data.IpfsHash}`);
};

pinFileToIPFS('./example.png'); // Replace with your file path
