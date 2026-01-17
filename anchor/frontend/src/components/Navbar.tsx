import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-10 py-6 border-b border-white/5">
      <div className="text-xl font-black text-white italic tracking-tighter">PHARMATRACE</div>
      <WalletMultiButton className="btn-secondary"/>
    </nav>
  );
}