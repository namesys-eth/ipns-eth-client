import React from 'react'
import './index.css'
import '@rainbow-me/rainbowkit/styles.css'
import type { AppProps } from 'next/app'
import {
  RainbowKitProvider,
  getDefaultWallets
} from '@rainbow-me/rainbowkit'
import type {
  Theme
} from '@rainbow-me/rainbowkit'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import {
  mainnet,
  goerli
} from 'wagmi/chains'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { isMobile } from 'react-device-detect'

let rainbowFont = ''
if (isMobile) {
  rainbowFont = 'Spotnik'
} else {
  rainbowFont = 'Spotnik'
}

const customTheme: Theme = {
  blurs: {
    modalOverlay: '',
  },
  colors: {
    accentColor: 'linear-gradient(112deg, rgba(190,95,65,1) 0%, rgba(191,41,36,1) 48%, rgba(203,111,0,1) 100%)',
    accentColorForeground: 'white',
    actionButtonBorder: 'white',
    actionButtonBorderMobile: 'white',
    actionButtonSecondaryBackground: 'linear-gradient(112deg, rgba(190,95,65,1) 0%, rgba(191,41,36,1) 48%, rgba(203,111,0,1) 100%)',
    closeButton: 'black',
    closeButtonBackground: 'linear-gradient(112deg, rgba(198,127,105,1) 0%, rgba(218,85,81,1) 48%, rgba(212,160,99,1) 100%)',
    connectButtonBackground: 'linear-gradient(112deg, rgba(190,95,65,1) 0%, rgba(191,41,36,1) 48%, rgba(203,111,0,1) 100%)',
    connectButtonBackgroundError: 'red',
    connectButtonInnerBackground: 'linear-gradient(153deg, rgba(190,95,65,1) 0%, rgba(152,33,30,1) 48%, rgba(203,111,0,1) 100%)',
    connectButtonText: 'white',
    connectButtonTextError: 'white',
    connectionIndicator: 'white',
    downloadBottomCardBackground: 'none',
    downloadTopCardBackground: 'none',
    error: 'red',
    generalBorder: 'rgb(255, 255, 255, 0.75)',
    generalBorderDim: 'rgb(255, 255, 255, 0.25)',
    menuItemBackground: 'linear-gradient(112deg, rgba(190,95,65,1) 0%, rgba(191,41,36,1) 48%, rgba(203,111,0,1) 100%)',
    modalBackdrop: 'none',
    modalBackground: 'linear-gradient(42deg, rgba(125,90,78,1) 0%, rgba(97,53,38,1) 100%)',
    modalBorder: 'white',
    modalText: 'white',
    modalTextDim: 'white',
    modalTextSecondary: 'white',
    profileAction: 'rgb(0, 0, 0, 0.5)',
    profileActionHover: 'linear-gradient(112deg, rgba(190,95,65,1) 0%, rgba(191,41,36,1) 48%, rgba(203,111,0,1) 100%)',
    profileForeground: 'rgb(0, 0, 0, 0.5)',
    selectedOptionBorder: 'white',
    standby: 'white',
  },
  fonts: {
    body: `${rainbowFont}`,
  },
  radii: {
    actionButton: '4px',
    connectButton: '6px',
    menuButton: '6px',
    modal: '6px',
    modalMobile: '6px',
  },
  shadows: {
    connectButton: '',
    dialog: '',
    profileDetailsAction: '',
    selectedOption: '',
    selectedWallet: '',
    walletLogo: '',
  }
}

const { chains, publicClient } = configureChains(
  [
    process.env.NEXT_PUBLIC_NETWORK === 'goerli' ? goerli : mainnet
  ],
  [
    alchemyProvider({ apiKey: (process.env.NEXT_PUBLIC_NETWORK === 'goerli' ? process.env.NEXT_PUBLIC_ALCHEMY_ID_GOERLI : process.env.NEXT_PUBLIC_ALCHEMY_ID_MAINNET) || ''}),
    publicProvider()
  ]
)

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || ''
const { connectors } = getDefaultWallets({
  appName: 'NameSysLite',
  projectId,
  chains,
})

const appInfo = {
  appName: 'NameSys Lite Client',
}

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient
})

function MyApp({ Component, pageProps }: AppProps) {

  return (
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider
          modalSize={isMobile ? "compact" : "wide"}
          appInfo={appInfo}
          chains={chains}
          theme={customTheme}
        >  
          <Component {...pageProps} />
        </RainbowKitProvider>
      </WagmiConfig>
  )
}

export default MyApp
