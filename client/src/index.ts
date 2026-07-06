import { X402Client } from './x402-client';
import { Keys } from 'casper-js-sdk';
import { privateKeyToHex } from './eip712-signer';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

async function main() {
  // Generate a real key pair for testing
  const keyPair = Keys.Ed25519.new();
  const privateKey = keyPair.privateKey;
  const publicKey = keyPair.publicKey;
  const privateKeyHex = privateKeyToHex(privateKey);
  const publicKeyHex = publicKey.toHex();
  const accountHash = publicKey.toAccountHashStr();

  console.log('Generated new key pair:');
  console.log('Private Key:', privateKeyHex);
  console.log('Public Key:', publicKeyHex);
  console.log('Account Hash:', accountHash);

  // Get API key from environment variable
  const facilitatorApiKey = process.env.CSPR_CLOUD_API_KEY;
  if (!facilitatorApiKey) {
    console.error('❌ CSPR_CLOUD_API_KEY not found in .env file!');
    console.error('Please create a .env file with your API key.');
    console.error('Example: CSPR_CLOUD_API_KEY=your-actual-api-key-here');
    process.exit(1);
  }

  // Use the full account hash with prefix for the facilitator
  const recipientAddress = accountHash;

  const config = {
    payerPrivateKey: privateKeyHex,
    payerAddress: accountHash,
    recipientAddress: recipientAddress,
    tokenContractHash: 'd35ad922b558b107c6c7e27c8fd35a26161c956f96be41f93c6cd3c471fc78ac',
    amount: '1000',
    resourceUrl: 'https://my-api.com/rwa-transfer',
    facilitatorApiKey: facilitatorApiKey,
  };

  const client = new X402Client(config.facilitatorApiKey);

  console.log('🔄 Making x402 payment...');
  console.log(`📤 Sending to: ${config.recipientAddress}`);
  
  const transaction = await client.makePayment(
    config.payerPrivateKey,
    config.payerAddress,
    config.recipientAddress,
    config.tokenContractHash,
    config.amount,
    config.resourceUrl
  );

  if (transaction) {
    console.log(`✅ Payment successful! Transaction: ${transaction}`);
  } else {
    console.log('❌ Payment failed');
  }
}

main().catch(console.error);
export { X402Client } from './x402-client';