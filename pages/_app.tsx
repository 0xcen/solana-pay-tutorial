import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Layout from '../components/Layout'
import Head from 'next/head'

import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { clusterApiUrl } from '@solana/web3.js'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

require('@solana/wallet-adapter-react-ui/styles.css')

function MyApp({ Component, pageProps }: AppProps) {
  const network = WalletAdapterNetwork.Devnet

  const endpoint = clusterApiUrl(network)

  const wallets = [new PhantomWalletAdapter()]
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>
          <Layout>
            <Head>
              <title>Cookies Inc</title>
            </Head>
            <Component {...pageProps} />
          </Layout>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default MyApp
