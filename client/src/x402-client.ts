import axios from 'axios';
import { Keys } from 'casper-js-sdk';
import { 
  signTransferAuthorization, 
  generateNonce, 
  TransferAuthorization, 
  EIP712Domain
} from './eip712-signer';

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export interface PaymentPayload {
  x402Version: number;
  resource: {
    url: string;
    description?: string;
  };
  accepted: {
    scheme: string;
    network: string;
    asset: string;
    amount: string;
    payTo: string;
    maxTimeoutSeconds: number;
  };
  payload: {
    signature: string;
    publicKey: string;
    authorization: TransferAuthorization;
  };
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  payTo: string;
  amount: string;
  asset: string;
  maxTimeoutSeconds: number;
  extra: {
    name: string;
    version: string;
    decimals: string;
    symbol: string;
  };
}

export class X402Client {
  private facilitatorUrl: string = 'https://x402-facilitator.cspr.cloud';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async makePayment(
    payerPrivateKeyHex: string,
    payerAddress: string,
    recipientAddress: string,
    tokenContractHash: string,
    amount: string,
    resourceUrl: string
  ): Promise<string | null> {
    const nonce = generateNonce();
    const validAfter = Math.floor(Date.now() / 1000);
    const validBefore = validAfter + 300;

    // Clean both addresses to match formats globally across authorization and requirements
    const cleanPayer = payerAddress.replace('account-hash-', '');
    const cleanRecipient = recipientAddress.replace('account-hash-', '');

    const authorization: TransferAuthorization = {
      from: cleanPayer,
      to: cleanRecipient,
      value: amount,
      validAfter: validAfter.toString(),
      validBefore: validBefore.toString(),
      nonce: nonce,
    };

    const privateKeyBytes = hexToUint8Array(payerPrivateKeyHex);
    const publicKeyBytes = Keys.Ed25519.privateToPublicKey(privateKeyBytes);
    const keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
    const publicKey = keyPair.publicKey.toHex();

    const domain: EIP712Domain = {
      name: 'Cep18x402',
      version: '1',
      network: 'casper:casper-test',
      tokenContractHash: tokenContractHash,
    };

    const signature = signTransferAuthorization(payerPrivateKeyHex, domain, authorization);

    const payload: PaymentPayload = {
      x402Version: 2,
      resource: {
        url: resourceUrl,
        description: 'RWA Token Transfer',
      },
      accepted: {
        scheme: 'exact',
        network: 'casper:casper-test',
        asset: tokenContractHash,
        amount: amount,
        payTo: cleanRecipient, // Kept clean to match authorization.to format
        maxTimeoutSeconds: 300,
      },
      payload: {
        signature: signature,
        publicKey: publicKey,
        authorization: authorization,
      },
    };

    const requirements: PaymentRequirements = {
      scheme: 'exact',
      network: 'casper:casper-test',
      payTo: cleanRecipient, // Kept clean to match authorization.to format
      amount: amount,
      asset: tokenContractHash,
      maxTimeoutSeconds: 900,
      extra: {
        name: 'Cep18x402',
        version: '1',
        decimals: '0',
        symbol: 'RWA',
      },
    };

    const isVerified = await this.verify(payload, requirements);
    if (!isVerified) {
      console.error('Payment verification failed');
      return null;
    }

    return await this.settle(payload, requirements);
  }

  async verify(payload: PaymentPayload, requirements: PaymentRequirements): Promise<boolean> {
    try {
      const response = await axios.post(
        `${this.facilitatorUrl}/verify`,
        { paymentPayload: payload, paymentRequirements: requirements },
        { headers: { 'Authorization': this.apiKey, 'Content-Type': 'application/json' } }
      );

      const result = response.data;
      if (result.isValid) {
        console.log('✅ Payment verified! Payer:', result.payer);
        return true;
      } else {
        console.error('❌ Verification failed:', result.invalidMessage);
        return false;
      }
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }

  async settle(payload: PaymentPayload, requirements: PaymentRequirements): Promise<string | null> {
    try {
      const response = await axios.post(
        `${this.facilitatorUrl}/settle`,
        { paymentPayload: payload, paymentRequirements: requirements },
        { headers: { 'Authorization': this.apiKey, 'Content-Type': 'application/json' } }
      );

      const result = response.data;
      if (result.success) {
        console.log('✅ Payment settled! Transaction:', result.transaction);
        return result.transaction;
      } else {
        console.error('❌ Settlement failed:', result.errorMessage);
        return null;
      }
    } catch (error) {
      console.error('Settlement error:', error);
      return null;
    }
  }
}