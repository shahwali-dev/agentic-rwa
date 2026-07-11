import { config } from "./config";
import { X402Client } from "./x402-client";
import { PaymentRequest } from "./types";

async function main(): Promise<void> {
  const client = new X402Client();

  const request: PaymentRequest = {
    payerPemPath: config.env.payerSecretKeyPath,

    payerAccountHash: config.env.payerAccountHash,

    recipientAccountHash:
      "account-hash-d35ad922b558b107c6c7e27c8fd35a26161c956f96be41f93c6cd3c471fc78ac",

    tokenContractHash:
      "8df5d26790e18cf0404502c62ce5dc9025800ad6975c97466e20506c39c505b6",

    amount: "25",

    resourceUrl: "https://my-api.com/rwa-transfer",
  };

  const transaction = await client.makePayment(request);

  console.log("");
  console.log("========================================");
  console.log("✅ Payment Successful");
  console.log("========================================");
  console.log(`Transaction Hash: ${transaction}`);
}

main().catch((error) => {
  console.error("");
  console.error("========================================");
  console.error("❌ Payment Failed");
  console.error("========================================");

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
});