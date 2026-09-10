import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  // RainbowKit requires a 32-char hex projectId at config time.
  // Replace with a real WalletConnect Cloud id before demo.
  "0123456789abcdef0123456789abcdef";

const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        metaMaskWallet,
        rainbowWallet,
        walletConnectWallet,
        injectedWallet,
      ],
    },
  ],
  {
    appName: "ContentProof",
    projectId,
  },
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(rpcUrl || undefined),
  },
  ssr: true,
});
