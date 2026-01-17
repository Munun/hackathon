import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { PROGRAM_ID, IDL } from '../utils/constants';

export function useSolanaProgram() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const getProgram = () => {
    if (!wallet.publicKey || !wallet.signTransaction) throw new Error('Wallet not connected');
    const provider = new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
    return new Program(IDL as any, provider);
  };

  const signConsent = async (trialName: string) => {
    const program = getProgram();
    const encoder = new TextEncoder();
    const data = encoder.encode(`Verified Medical Trial Consent v1.0 - ${trialName}`);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const agreementHash = Array.from(new Uint8Array(hashBuffer));

    const [consentPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from('consent'), wallet.publicKey!.toBuffer()],
      PROGRAM_ID
    );

    return await program.methods
      .signConsent(agreementHash)
      .accounts({
        consentRecord: consentPDA,
        patient: wallet.publicKey!,
        systemProgram: SystemProgram.programId,
      } as any).rpc();
  };

  const rewardPatient = async (patientPubkey: PublicKey, amount: number) => {
    const program = getProgram();
    // Logic for finding the vault and token accounts would go here
    // based on your lib.rs RewardPatient struct
  };

  return { signConsent, rewardPatient };
}