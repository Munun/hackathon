import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { PROGRAM_ID, IDL } from '../utils/constants';

export function useSolanaProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const getProgram = () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const provider = new AnchorProvider(
      connection,
      wallet as any,
      { commitment: 'confirmed' }
    );

    return new Program(IDL as any, PROGRAM_ID, provider);
  };

  const signConsent = async (trialName: string) => {
    const program = getProgram();
    
    // Generate SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(`Verified Medical Trial Consent v1.0 - ${trialName}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const agreementHash = Array.from(new Uint8Array(hashBuffer));

    // Derive PDA
    const [consentRecordPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), wallet.publicKey!.toBuffer()],
      PROGRAM_ID
    );

    // Execute transaction
    const tx = await program.methods
      .signConsent(agreementHash)
      .accounts({
        consentRecord: consentRecordPDA,
        patient: wallet.publicKey!,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  return { signConsent };
}
