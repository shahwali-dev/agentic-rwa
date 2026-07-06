import { Keys } from 'casper-js-sdk';

export interface EIP712Domain {
  name: string;
  version: string;
  network: string;
  tokenContractHash: string;
}

export interface TransferAuthorization {
  from: string;
  to: string;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: string;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function signTransferAuthorization(
  privateKeyHex: string,
  domain: EIP712Domain,
  authorization: TransferAuthorization
): string {
  const privateKeyBytes = hexToUint8Array(privateKeyHex);
  
  const publicKeyBytes = Keys.Ed25519.privateToPublicKey(privateKeyBytes);
  const keyPair = Keys.Ed25519.parseKeyPair(publicKeyBytes, privateKeyBytes);
  
  const messageHash = buildAuthorizationHash(domain, authorization);
  const signature = keyPair.sign(messageHash);
  return Buffer.from(signature).toString('hex');
}

function buildAuthorizationHash(
  domain: EIP712Domain,
  authorization: TransferAuthorization
): Uint8Array {
  const encoder = new TextEncoder();
  
  const parts = [
    domain.name,
    domain.version,
    domain.network,
    domain.tokenContractHash,
    authorization.from,
    authorization.to,
    authorization.value,
    authorization.validAfter,
    authorization.validBefore,
    authorization.nonce
  ];
  
  const encodedParts = parts.map(p => encoder.encode(p));
  
  let totalLength = 0;
  encodedParts.forEach(p => totalLength += p.length);
  
  const result = new Uint8Array(totalLength);
  let offset = 0;
  encodedParts.forEach(p => {
    result.set(p, offset);
    offset += p.length;
  });
  
  return result.slice(0, 32);
}

export function generateNonce(): string {
  const nonce = new Uint8Array(32);
  crypto.getRandomValues(nonce);
  return Buffer.from(nonce).toString('hex');
}

export function privateKeyToHex(privateKey: Uint8Array): string {
  return Buffer.from(privateKey).toString('hex');
}