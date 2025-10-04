'use client';

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { sepolia, holesky } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Define supported chains
const chains = [sepolia, holesky];

// Create a react-query client
const queryClient = new QueryClient();

// Create the wagmi config using the new v2 API
const config = createConfig({
  chains,
  transports: {
    [sepolia.id]: http(),
    [holesky.id]: http(),
  },
});

export function Providers({ children }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider chains={chains}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Export for individual usage if needed
export { config, chains };
