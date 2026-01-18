import { useWallet } from '@solana/wallet-adapter-react';
import { useSolana } from '../components/SolanaContext';
import { PublicKey, SystemProgram } from '@solana/web3.js';

export function useSolanaProgram() {
  const { program, programId } = useSolana();
  const { publicKey } = useWallet();

  /**
   * Signs a consent agreement on-chain
   * @param documentText - The consent document text (will be hashed)
   * @returns Transaction signature
   */
  const signConsent = async (documentText: string): Promise<string> => {
    // 1. Check if wallet is connected
    if (!publicKey) {
      throw new Error('❌ Please connect your wallet first!');
    }

    // 2. Check if program is loaded
    if (!program) {
      throw new Error('❌ Solana program not loaded. Try reconnecting your wallet.');
    }

    console.log('🔐 Starting consent signing process...');
    console.log('📱 Your wallet:', publicKey.toBase58());

    try {
      // 3. Hash the document text (SHA-256) - matches your Flask backend
      const encoder = new TextEncoder();
      const data = encoder.encode(documentText);
      // @ts-ignore - Fix for TypeScript ArrayBuffer type issue
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      
      console.log('📄 Document:', documentText);
      console.log('🔐 Hash (hex):', Buffer.from(hashArray).toString('hex'));

      // 4. Derive the PDA (Program Derived Address) for storing consent
      // This MUST match your Rust program's seeds: [b"consent", patient.key().as_ref()]
      const [consentPda, bump] = PublicKey.findProgramAddressSync(
        [
          Buffer.from('consent'),  // First seed
          publicKey.toBuffer()     // Second seed (patient's public key)
        ],
        programId
      );

      console.log('📍 Consent PDA:', consentPda.toBase58());
      console.log('🎯 Bump:', bump);

      // 5. Call the Anchor program's "sign_consent" instruction
      // CRITICAL: Account name must match your Rust struct - it's "consent_record" not "consent"
      const tx = await program.methods
        .signConsent(hashArray)  // Pass the 32-byte hash array
        .accounts({
          consentRecord: consentPda,        // ← Fixed: matches Rust's "consent_record"
          patient: publicKey,               // Your wallet signs the transaction
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log('✅ Transaction successful!');
      console.log('🔗 TX Signature:', tx);
      console.log('🌐 View on Explorer:', `https://explorer.solana.com/tx/${tx}?cluster=devnet`);
      
      return tx;

    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      
      // Provide user-friendly error messages
      if (error.message?.includes('User rejected')) {
        throw new Error('You rejected the transaction in your wallet');
      }
      
      if (error.message?.includes('insufficient funds')) {
        throw new Error('Insufficient SOL for transaction fees. Get devnet SOL from https://faucet.solana.com');
      }

      if (error.logs) {
        console.error('Program logs:', error.logs);
      }
      
      throw new Error(error.message || 'Transaction failed');
    }
  };

  /**
   * Verify if a consent exists on-chain for a given patient
   * @param patientPubkey - The patient's public key to check
   * @returns Consent data or null
   */
  const verifyConsent = async (patientPubkey: PublicKey) => {
    if (!program) {
      throw new Error('Program not loaded');
    }

    try {
      // Derive the same PDA
      const [consentPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('consent'), patientPubkey.toBuffer()],
        programId
      );

      // Fetch the account data
      const consentAccount = await program.account.consentRecord.fetch(consentPda);
      
      console.log('📄 Consent found:', {
        patient: consentAccount.patient.toBase58(),
        hash: Buffer.from(consentAccount.agreementHash).toString('hex'),
        verified: consentAccount.isVerified,
      });
      
      return consentAccount;
    } catch (e) {
      console.log('ℹ️ No consent found for patient:', patientPubkey.toBase58());
      return null;
    }
  };

  /**
   * Check if wallet has enough SOL for transactions
   */
  const checkBalance = async () => {
    if (!publicKey || !program) return null;
    
    const balance = await program.provider.connection.getBalance(publicKey);
    const balanceInSol = balance / 1e9;
    
    console.log(`💰 Wallet balance: ${balanceInSol.toFixed(4)} SOL`);
    
    if (balanceInSol < 0.01) {
      console.warn('⚠️ Low balance! Get devnet SOL: https://faucet.solana.com');
    }
    
    return balanceInSol;
  };

  return {
    signConsent,
    verifyConsent,
    checkBalance,
    isReady: !!program && !!publicKey,  // True when everything is connected
    walletAddress: publicKey?.toBase58() || null,
  };
}
