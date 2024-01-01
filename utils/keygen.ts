import { hkdf } from '@noble/hashes/hkdf'
import { sha256 } from '@noble/hashes/sha256'
import * as secp256k1 from '@noble/secp256k1'
import * as ed25519 from '@noble/ed25519'

var _fetch: any

try {
  _fetch = fetch
} catch { }

export function useFetchImplementation(fetchImplementation: any) {
  _fetch = fetchImplementation
}

/**
 * @param  username key identifier
 * @param    caip10 CAIP identifier for the blockchain account
 * @param signature Deterministic signature from X-wallet provider
 * @param  password Optional password
 * @returns Deterministic private/public keypairs as hex strings
 * Hex-encoded
 * [ed25519.priv, ed25519.pub]
 */
export async function KEYGEN(
  username: string,
  caip10: string,
  signature: string,
  password: string | undefined
): Promise<[
  string, string
]> {
  if (signature.length < 64)
    throw new Error('SIGNATURE TOO SHORT; LENGTH SHOULD BE 65 BYTES')
  let inputKey = sha256(
    secp256k1.utils.hexToBytes(
      signature.toLowerCase().startsWith('0x') ? signature.slice(2) : signature
    )
  )
  let info = `${caip10}:${username}`
  let salt = sha256(`${info}:${password ? password : ''}:${signature.slice(-64)}`)
  let hashKey = hkdf(sha256, inputKey, salt, info, 42)
  let ed25519priv = ed25519.utils.hashToPrivateScalar(hashKey).toString(16).padStart(64, "0") // ed25519 Private Key
  let ed25519pub = secp256k1.utils.bytesToHex(await ed25519.getPublicKey(ed25519priv)) // ed25519 Public Key
  return [ // Hex-encoded [ed25519.priv, ed25519.pub]
    ed25519priv, ed25519pub
  ]
}
