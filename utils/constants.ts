import iEnsLegacyRegistry from "../ABI/ENSLegacyRegistry.json";
import iEnsLegacyRegistrar from "../ABI/ENSLegacyRegistrar.json";
import iEnsLegacyResolver from "../ABI/ENSLegacyResolver.json";
import iEnsUniversalResolverGoerli from "../ABI/ENSUniversalResolverGoerli.json";
import iEnsPublicResolverMainnet from "../ABI/ENSPublicResolverMainnet.json";
import iEnsUniversalResolverMainnet from "../ABI/ENSUniversalResolverMainnet.json";
import iEnsWrapperGoerli from "../ABI/ENSWrapperGoerli.json";
import iEnsWrapperMainnet from "../ABI/ENSWrapperMainnet.json";
import iCCIP2Goerli from "../ABI/CCIP2Goerli.json";
import iCCIP2Mainnet from "../ABI/CCIP2Mainnet.json";
import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "ethers";
import Web3 from "web3";

export const modalTemplate = {
  modalData: "",
  trigger: false,
};

export const modalSaltTemplate = {
  modalData: "",
  trigger: false,
};

export const modalSuccessTemplate = {
  modalData: undefined,
  trigger: false,
};

export interface MainBodyState {
  modalData: string;
  trigger: boolean;
}

export interface MainSaltState {
  modalData: string;
  trigger: boolean;
}

export interface MainSuccessState {
  modalData: string | undefined;
  trigger: boolean;
}

export const zeroAddress = "0x" + "0".repeat(40);
export const zeroBytes = "0x" + "0".repeat(64);
export const zeroKey = "0x" + "0".repeat(64);
export const buffer = "\x19Ethereum Signed Message:\n";
const ipnsRegex = /^[a-z0-9]{62}$/;
const ipfsRegexCID0 = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
const ipfsRegexCID1 = /^bafy[a-zA-Z0-9]{55}$/;
const onionRegex = /^[a-z2-7]{16,56}$/;
const urlRegex =
  /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
const hexRegex = /^[0-9a-fA-F]+$/;

// Random string generator
export function randomString(length: number) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

// ENS Domain's Metadata
export const meta = {
  user: zeroAddress,
  avatar: "",
  ens: "",
};

let network = process.env.NEXT_PUBLIC_NETWORK;
export const alchemyConfig = {
  apiKey:
    network === "goerli"
      ? process.env.NEXT_PUBLIC_ALCHEMY_ID_GOERLI
      : process.env.NEXT_PUBLIC_ALCHEMY_ID_MAINNET,
  network: network === "goerli" ? Network.ETH_GOERLI : Network.ETH_MAINNET,
  chainId: network === "goerli" ? "5" : "1",
};
const alchemyEndpoint =
  `https://eth-${network}.g.alchemy.com/v2/` + alchemyConfig.apiKey;
const web3 = new Web3(alchemyEndpoint);
export const alchemy = new Alchemy(alchemyConfig);
export const provider = new ethers.AlchemyProvider(
  network,
  alchemyConfig.apiKey
);
export const ccip2 = [
  "0x19F83D2042962b163ED910eFCA5EDfed765A7e89", // CCIP2 Resolver Goerli
  "0x839B3B540A9572448FD1B2335e0EB09Ac1A02885", // CCIP2 Resolver Mainnet
];
export const defaultGateway =
  network === "goerli"
    ? "https://ccip.namesys.xyz/5"
    : "https://ccip.namesys.xyz";
export const waitingPeriod = 1 * (network === "goerli" ? 1 : 60) * 60; // 60 mins
export const ensContracts = [
  "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e", // Legacy Registry (Goerli & Mainnet)
  "0x57f1887a8bf19b14fc0df6fd9b2acc9af147ea85", // Legacy Registrar (Goerli & Mainnet)
  "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63", // Public Legacy Resolver 1 (Mainnet)
  "0x114D4603199df73e7D157787f8778E21fCd13066", // Name Wrapper (Goerli)
  "0xd7a4F6473f32aC2Af804B3686AE8F1932bC35750", // Universal Resolver (Goerli)
  "0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41", // Public Legacy Resolver 2 (Mainnet)
  "0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63", // Universal Resolver (Mainnet)
  "0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401", // Name Wrapper (Mainnet)
];
export const ensInterface = [
  iEnsLegacyRegistry, // Legacy Registry (Goerli & Mainnet)
  iEnsLegacyRegistrar, // Legacy Registrar (Goerli & Mainnet)
  iEnsLegacyResolver, // Public Legacy Resolver 1 (Mainnet)
  iEnsWrapperGoerli, // Name Wrapper (Goerli)
  iEnsUniversalResolverGoerli, // Universal Resolver (Goerli)
  iEnsPublicResolverMainnet, // Public Legacy Resolver 2 (Mainnet)
  iEnsUniversalResolverMainnet, // Universal Resolver (Mainnet)
  iEnsWrapperMainnet, // Name Wrapper (Mainnet)
];

export const ccip2Interface = [iCCIP2Goerli, iCCIP2Mainnet];
export const ensConfig = [
  {
    addressOrName: ensContracts[0],
    contractInterface: ensInterface[0],
  },
  {
    addressOrName: ensContracts[1],
    contractInterface: ensInterface[1],
  },
  {
    addressOrName: ensContracts[2],
    contractInterface: ensInterface[2],
  },
  {
    addressOrName: ensContracts[3],
    contractInterface: ensInterface[3],
  },
  {
    addressOrName: ensContracts[4],
    contractInterface: ensInterface[4],
  },
  {
    addressOrName: ensContracts[5],
    contractInterface: ensInterface[5],
  },
  {
    addressOrName: ensContracts[6],
    contractInterface: ensInterface[6],
  },
  {
    addressOrName: ensContracts[7],
    contractInterface: ensInterface[7],
  },
];
export const ccip2Config = [
  {
    // CCIP2 Resolver Goerli
    addressOrName: ccip2[0],
    contractInterface: ccip2Interface[0],
  },
  {
    // CCIP2 Resolver Mainnet
    addressOrName: ccip2[1],
    contractInterface: ccip2Interface[1],
  },
];

export type RecordsType = [
  {
    id: number;
    name: string;
    ipns: string;
    ipfs: string;
    cid: {
      v0: string;
      v1: string;
    };
    source: string;
    loading: {
      ipns: boolean;
      ipfs: boolean;
    };
    new: string;
    ens: string;
    block: boolean;
  }
];

// ENS Domain's Records
export const records = [
  {
    id: 0,
    name: "...",
    ipns: "",
    ipfs: "",
    cid: {
      v0: "",
      v1: "",
    },
    source: "",
    loading: {
      ipns: true,
      ipfs: true,
    },
    ens: "",
    new: "",
    block: false,
  },
  {
    id: 1,
    name: "...",
    ipns: "",
    ipfs: "",
    cid: {
      v0: "",
      v1: "",
    },
    source: "",
    loading: {
      ipns: true,
      ipfs: true,
    },
    ens: "",
    new: "",
    block: false,
  },
  {
    id: 2,
    name: "...",
    ipns: "",
    ipfs: "",
    cid: {
      v0: "",
      v1: "",
    },
    source: "",
    loading: {
      ipns: true,
      ipfs: true,
    },
    ens: "",
    new: "",
    block: false,
  },
  {
    id: 3,
    name: "...",
    ipns: "",
    ipfs: "",
    cid: {
      v0: "",
      v1: "",
    },
    source: "",
    loading: {
      ipns: true,
      ipfs: true,
    },
    ens: "",
    new: "",
    block: false,
  },
];

// Returns formatted ed25519/IPNS keypair
export function formatkey(keypair: [string, string]) {
  return "08011240" + keypair[0] + keypair[1]; // ed25519 keypair
}

// Checks if value is good for a field
export function isGoodValue(id: string, value: string) {
  if (value !== null) {
    return (
      (id === "contenthash" && isContenthash(value)) ||
      (id === "addr" && isAddr(value)) ||
      (id === "avatar" && isAvatar(value))
    );
  } else {
    return false;
  }
}

// Checks if new value is entered in a field
export function isValue(id: string, value: string) {
  if (value !== null) {
    return id === "contenthash" && value;
  } else {
    return false;
  }
}

// Truncate hex string
export function truncateHexString(hexString: string) {
  const prefix = hexString.slice(0, 2);
  const truncated = hexString.slice(2, 6) + "..." + hexString.slice(-4);
  return prefix + truncated;
}

// Copy <input>
export function copyInput(element: string) {
  const copyText = document.getElementById(element) as HTMLInputElement;
  copyText.select();
  copyText.setSelectionRange(0, 99999);
  navigator.clipboard
    .writeText(copyText.value)
    .then(() => {})
    .catch((error) => {
      console.error("ERROR:", error);
    });
}

// Copy <span>, <div>
export function copyToClipboard(value: string, spanId: string, divId: string) {
  const hiddenInput = document.createElement("input");
  hiddenInput.value = value;
  document.body.appendChild(hiddenInput);
  hiddenInput.select();
  document.execCommand("copy");
  document.body.removeChild(hiddenInput);
  const spanElement = document.getElementById(spanId);
  const divElement = document.getElementById(divId);
  if (spanElement && divElement) {
    if (spanElement.style.color === "lightgreen")
      spanElement.style.color = "white";
    else spanElement.style.color = "white";
    if (divElement.style.color === "lightgreen")
      divElement.style.color = "white";
    else divElement.style.color = "white";
    // Reset the color after a delay (e.g., 2 seconds)
    setTimeout(() => {
      if (spanElement.style.color === "lightgreen")
        spanElement.style.color = "white"; // Reset to the default color
      else spanElement.style.color = "lightgreen";
      if (divElement.style.color === "lightgreen")
        divElement.style.color = "white";
      else divElement.style.color = "lightgreen";
    }, 2000);
  }
}

// Check if value is a valid Name
export function isDomain(value: string) {
  return value.endsWith(".eth") && value.length <= 32 + 4;
}
// Check if value is a valid Addr
export function isAddr(value: string) {
  return (
    value.startsWith("0x") &&
    value.length === 42 &&
    hexRegex.test(value.split("0x")[1])
  );
}
// Check if value is a valid Name
export function isName(value: string) {
  return value.length > 2 && value.length < 11 && value !== "...";
}
// Check if value is a valid Avatar URL
export function isAvatar(value: string) {
  return (
    urlRegex.test(value) ||
    value.startsWith("ipfs://") ||
    value.startsWith("eip155:")
  );
}
// Check if value is a valid Contenthash
export function isContenthash(value: string) {
  const prefixIPFS = value.substring(0, 7);
  const prefixOnion = value.substring(0, 8);
  return (
    (prefixIPFS === "ipns://" && ipnsRegex.test(value.substring(7))) || // Check IPNS
    (prefixIPFS === "ipfs://" && ipfsRegexCID0.test(value.substring(7))) || // Check IPFS CIDv0
    (prefixIPFS === "ipfs://" && ipfsRegexCID1.test(value.substring(7))) || // Check IPFS CIDv1
    (prefixOnion === "onion://" && onionRegex.test(value.substring(8))) // Check Onion v2 & v3
  );
}

// Records History object with empty strings
export const EMPTY_HISTORY_RECORDS = {
  type: "history",
  data: {
    ipns: [""],
    ipfs: [""],
    timestamp: [""],
    revision: [""],
    sequence: [""],
    name: [""],
  },
};
