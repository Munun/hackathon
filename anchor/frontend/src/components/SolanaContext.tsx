import { createContext, useContext, useMemo } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import idl from '../../tests/pharma_trace.json'; 

const programId = new PublicKey("76bbGQg8WhL8MxgvDVqoLLqDjCWzZMsiUN5g3r3iWXm1");
const SolanaContext = createContext<any>(null);

export const SolanaProvider = ({ children }: { children: React.ReactNode }) => {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, { preflightCommitment: 'processed' });
    return new Program(idl as Idl, programId, provider);
  }, [wallet, connection]);

  return (
    <SolanaContext.Provider value={{ program, wallet, programId }}>
      {children}
    </SolanaContext.Provider>
  );
};
export const useSolana = () => useContext(SolanaContext);
