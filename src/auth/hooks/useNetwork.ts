import { atom, useRecoilState, useRecoilValue } from "recoil"
import { useNetworks } from "app/InitNetworks"
import { getStoredNetwork, storeNetwork } from "../scripts/network"
import { useWallet, WalletStatus } from "@terra-money/wallet-provider"
import { walletState } from "./useAuth"
import is from "../scripts/is"

const networkState = atom({
  key: "network",
  default: getStoredNetwork(),
})

export const useNetworkState = () => {
  const [storedNetwork, setNetwork] = useRecoilState(networkState)

  const changeNetwork = (network: NetworkName) => {
    if (network !== storedNetwork) {
      setNetwork(network)
      storeNetwork(network)
    }
  }

  return [storedNetwork, changeNetwork] as const
}

/* helpers */
export const useNetworkOptions = () => {
  return [
    { value: "mainnet", label: "Mainnet" },
    { value: "testnet", label: "Testnet" },
    { value: "classic", label: "Classic" },
    { value: "classictestnet", label: "Classic TestNet" },
    { value: "localterra", label: "LocalTerra" },
  ]
}

export const useNetwork = (): Record<ChainID, InterchainNetwork> => {
  const { networks, filterEnabledNetworks } = useNetworks()
  const [network, setNetwork] = useNetworkState()
  const wallet = useRecoilValue(walletState)
  const connectedWallet = useWallet()

  // check connected wallet
  if (connectedWallet.status === WalletStatus.WALLET_CONNECTED) {
    if (network !== "mainnet" && "phoenix-1" in connectedWallet.network) {
      setNetwork("mainnet")
    } else if (network !== "testnet" && "pisco-1" in connectedWallet.network) {
      setNetwork("testnet")
    } else if (
      network !== "classic" &&
      "columbus-5" in connectedWallet.network
    ) {
      setNetwork("classic")
    } else if (
      network !== "classictestnet" &&
      "rebel-2" in connectedWallet.network
    ) {
      setNetwork("classictestnet")
    } else if (
      network !== "localterra" &&
      "localterra" in connectedWallet.network
    ) {
      setNetwork("localterra")
    }

    return filterEnabledNetworks(
      connectedWallet.network as Record<ChainID, InterchainNetwork>
    )
  }

  // multisig wallet are supported only on terra
  if (is.multisig(wallet)) {
    const terra = Object.values(
      networks[network as NetworkName] as Record<ChainID, InterchainNetwork>
    ).find(({ prefix }) => prefix === "terra")
    if (!terra) return {}
    return filterEnabledNetworks({ [terra.chainID]: terra })
  }

  if (wallet && !wallet?.words?.["118"]) {
    const chains330 = Object.values(
      networks[network as NetworkName] as Record<ChainID, InterchainNetwork>
    ).filter(({ coinType }) => coinType === "330")

    return filterEnabledNetworks(
      chains330.reduce((acc, chain) => {
        acc[chain.chainID] = chain
        return acc
      }, {} as Record<ChainID, InterchainNetwork>)
    )
  }

  return filterEnabledNetworks(networks[network as NetworkName])
}

export const useNetworkName = () => {
  const network = useRecoilValue(networkState)
  return network
}

export const useChainID = () => {
  const network = useRecoilValue(networkState)
  switch (network) {
    case "mainnet":
      return "phoenix-1"
    case "testnet":
      return "pisco-1"
    case "classic":
      return "columbus-5"
    case "classictestnet":
      return "rebel-2"
    case "localterra":
      return "localterra"
  }

  return ""
}
