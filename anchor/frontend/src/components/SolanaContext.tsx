import { createContext, useContext, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../contracts/pharma_trace.json'; 

// ⚠️ CRITICAL: This MUST match your declare_id!() in lib.rs
// Your lib.rs shows: declare_id!("5DMXqq7v2gkNSyBQ9P6XMFgUFQNcLdJHdhFi9JEPfcpa");
const programId = new PublicKey("5DMXqq7v2gkNSyBQ9P6XMFgUFQNcLdJHdhFi9JEPfcpa");

console.log('🎯 Program ID:', programId.toBase58());

const SolanaContext = createContext<any>(null);

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  // Create the Anchor program instance
  const program = useMemo(() => {
    if (!wallet) {
      console.log('⏳ Waiting for wallet connection...');
      return null;
    }

    try {
      const provider = new AnchorProvider(
        connection, 
        wallet, 
        { 
          preflightCommitment: 'processed',
          commitment: 'processed' 
        }
      );

      const prog = new Program(idl as Idl, programId, provider);
      
      console.log('✅ Anchor program loaded successfully');
      console.log('📍 Program ID:', programId.toBase58());
      console.log('🌐 Network:', connection.rpcEndpoint);
      
      return prog;
    } catch (error) {
      console.error('❌ Failed to load Anchor program:', error);
      return null;
    }
  }, [wallet, connection]);

  return (
    <SolanaContext.Provider value={{ program, wallet, programId, connection }}>
      {children}
    </SolanaContext.Provider>
  );
};

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within SolanaProvider');
  }
  return context;
};

