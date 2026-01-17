import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey('5DMXqq7v2gkNSyBQ9P6XMFgUFQNcLdJHdhFi9JEPfcpa');
export const RESEARCHER_PUBKEY = new PublicKey('ESQzmo4dRJ6g3ECjUUDVTarwaFfpqqMuzwCGiDBub6xt');

export const IDL = {
  "version": "0.1.0",
  "name": "pharma_trace",
  "instructions": [
    {
      "name": "signConsent",
      "accounts": [
        { "name": "consentRecord", "isMut": true, "isSigner": false },
        { "name": "patient", "isMut": true, "isSigner": true },
        { "name": "systemProgram", "isMut": false, "isSigner": false }
      ],
      "args": [
        { "name": "agreementHash", "type": { "array": ["u8", 32] } }
      ]
    }
    // ... add other instructions here as needed
  ]
};