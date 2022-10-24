import { WalletPlugin } from '@ijstech/eth-wallet';
// import { getInfuraId, getSiteSupportedNetworks } from '.';
export const walletList = [
    {
        name: WalletPlugin.MetaMask,
        displayName: 'MetaMask',
        iconFile: 'metamask.png'
    },
    {
        name: WalletPlugin.TrustWallet,
        displayName: 'Trust Wallet',
        iconFile: 'trustwallet.svg'
    },
    {
        name: WalletPlugin.BinanceChainWallet,
        displayName: 'Binance Chain Wallet',
        iconFile: 'binance-chain-wallet.svg'
    },
]

// export const getWalletOptions = (): { [key in WalletPlugin]?: any } => {
    // let networkList = getSiteSupportedNetworks();
    // const rpcs: {[chainId: number]:string} = {}
    // for (const network of networkList) {
    //     let rpc = network.rpc
    //     if ( rpc ) rpcs[network.chainId] = rpc;
    // }
    // return {
    //     [WalletPlugin.WalletConnect]: {
    //         infuraId: getInfuraId(),
    //         bridge: "https://bridge.walletconnect.org",
    //         rpc: rpcs
    //     }
    // }
// }