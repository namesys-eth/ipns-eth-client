import Head from 'next/head'
import React from 'react'
import styles from './page.module.css'
import './index.css'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ethers } from 'ethers'
import * as constants from '../utils/constants'
import { isMobile } from 'react-device-detect'
import Loading from '../components/LoadingColors'
import { KEYGEN } from '../utils/keygen'
import Records from '../components/Records'
import Salt from '../components/Salt'
import Success from '../components/Success'
import Error from '../components/Error'
import { useWindowDimensions } from '../hooks/useWindowDimensions'
import {
  useAccount,
  useSignMessage
} from 'wagmi'
import Web3 from 'web3'
import './index.css'

export default function Home() {
  const { width, height } = useWindowDimensions() // Get window dimensions
  const [mobile, setMobile] = React.useState(false) // Set mobile or dekstop environment 
  const [write, setWrite] = React.useState(false) // Sets write flag
  const [sigCount, setSigCount] = React.useState(0) // Set signature count
  const [color, setColor] = React.useState('lime') // Set color
  const [crash, setCrash] = React.useState(false) // Set crash status
  const [user, setUser] = React.useState('') // Sets connected user
  const [success, setSuccess] = React.useState('') // Sets success text for the Success modal
  const [saltModal, setSaltModal] = React.useState(false) // Salt (password/key-identifier)
  const [successModal, setSuccessModal] = React.useState(false) // Success modal trigger
  const [message, setMessage] = React.useState('Loading') // Set message to display
  const [records, setRecords] = React.useState(constants.records) // Set records 
  const [meta, setMeta] = React.useState(constants.meta) // Set ENS metadata
  const [loading, setLoading] = React.useState(true) // Loading Records marker
  const [keypair, setKeypair] = React.useState<[string, string]>(['', '']) // Sets generated K_IPNS keys
  const [recordsState, setRecordsState] = React.useState<constants.MainBodyState>(constants.modalTemplate) // Records body state
  const [saltModalState, setSaltModalState] = React.useState<constants.MainSaltState>(constants.modalSaltTemplate) // Salt modal state
  const [successModalState, setSuccessModalState] = React.useState<constants.MainSaltState>(constants.modalSaltTemplate)
  // Variables
  const chain = process.env.NEXT_PUBLIC_NETWORK === 'mainnet' ? '1' : '5'
  const { address: _Wallet_ } = useAccount()
  const apiKey = chain === '1' ? process.env.NEXT_PUBLIC_ALCHEMY_ID_MAINNET : process.env.NEXT_PUBLIC_ALCHEMY_ID_GOERLI
  const network = chain === '1' ? 'mainnet' : 'goerli'
  const provider = new ethers.AlchemyProvider(network, apiKey)
  const alchemyEndpoint = `https://eth-${network}.g.alchemy.com/v2/` + apiKey
  const web3 = new Web3(alchemyEndpoint)
  const recoveredAddress = React.useRef<string>()
  const caip10 = `eip155:${chain}:${_Wallet_}`  // CAIP-10
  const origin = `eth:${_Wallet_ || constants.zeroAddress}`
  const PORT = process.env.NEXT_PUBLIC_PORT
  const SERVER = process.env.NEXT_PUBLIC_SERVER

  // Handle Records body data return
  const handleRecordsData = (data: string) => {
    setRecordsState(prevState => ({ ...prevState, modalData: data }))
  }
  // Handle Records body trigger
  const handleRecordsTrigger = (trigger: boolean) => {
    setRecordsState(prevState => ({ ...prevState, trigger: trigger }))
  }
  // Handle Salt modal data return
  const handleSaltModalData = (data: string | undefined) => {
    setSaltModalState(prevState => ({ ...prevState, modalData: data }))
  }
  // Handle Salt modal trigger
  const handleSaltTrigger = (trigger: boolean) => {
    setSaltModalState(prevState => ({ ...prevState, trigger: trigger }))
  }
  // Handle Success modal data return
  const handleSuccessModalData = (data: string | undefined) => {
    setSuccessModalState(prevState => ({ ...prevState, modalData: data }))
  }
  // Handle Success modal trigger
  const handleSuccessTrigger = (trigger: boolean) => {
    setSuccessModalState(prevState => ({ ...prevState, trigger: trigger }))
  }


  // FUNCTIONS
  // Counts live values of update
  function countVal(records: typeof constants.records) {
    let nonEmptyNewCount = 0
    for (var i = 0; i < records.length; i++) {
      if (records[i].new !== '') {
        nonEmptyNewCount++
      }
    }
    return nonEmptyNewCount
  }

  // Function for writing IPNS Revision metadata to NameSys backend; needed for updates
  async function writeRevision(revision: undefined, gas: {}, timestamp: string, _ipfs: string) {
    let __revision: any = {}
    if (revision) {
      const _revision = JSON.parse(JSON.stringify(revision, (key, value) => {
        return typeof value === 'bigint' ? String(value) : value
      }))
      if (_revision._name._privKey) _revision._name._privKey._key = {}
      __revision = JSON.stringify(_revision)
    } else {
      __revision = JSON.stringify(__revision)
    }
    const request = {
      user: _Wallet_,
      revision: {},
      ipns: '',
      ipfs: _ipfs,
      version: __revision,
      timestamp: timestamp,
    }
    try {
      await fetch(
        `${SERVER}:${PORT}/revision`,
        {
          method: "post",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        })
        .then(response => response.json())
        .then(data => {
          if (data.status) {
            return data.status === 'true'
          } else {
            return false
          }
        })
    } catch (error) {
      console.error('ERROR:', 'Failed to write Revision to CCIP2 backend')
      setMessage('Revision Update Failed')
      setCrash(true)
      setLoading(false)
      setColor('orangered')
    }
  }

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true)
    }
    setTimeout(() => {
      setLoading(false)
    }, 2000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  React.useEffect(() => {
    if (_Wallet_ && String(_Wallet_) !== constants.zeroAddress) {
      setUser(_Wallet_)
    } else {
      setUser('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_Wallet_])

  // Signature S_IPNS statement; S_IPNS(K_WALLET) [IPNS Keygen]
  // S_IPNS is not recovered on-chain; no need for buffer prepend and hashing of message required to sign
  function statementIPNSKey(extradata: string) {
    let _toSign = `Requesting Signature To Generate IPNS Key\n\nOrigin: ${origin}\nKey Type: ed25519\nExtradata: ${extradata}\nSigned By: ${caip10}`
    let _digest = _toSign
    return _digest
  }

  // Wagmi Signature hook
  const {
    data: signature,
    error: signError,
    isLoading: signLoading,
    signMessage
  } = useSignMessage({
    onSuccess(data, variables) {
      const address = ethers.verifyMessage(variables.message, data)
      recoveredAddress.current = address
    },
  })

  // Trigger Signer generation
  React.useEffect(() => {
    if (saltModalState.trigger) {
      setSigCount(1)
      const SIGN_SIGNER = async () => {
        signMessage({
          message: statementIPNSKey(
            ethers.keccak256(ethers.solidityPacked(
              ['bytes32', 'address'],
              [
                ethers.keccak256(ethers.solidityPacked(['string'], [saltModalState.modalData])),
                _Wallet_
              ]
            ))
          )
        })
      }
      SIGN_SIGNER()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saltModalState])

  // Set Records to write
  React.useEffect(() => {
    if (recordsState.trigger && recordsState.modalData) {
      let _allRecords = JSON.parse(recordsState.modalData)
      let _records = { ...records }
      for (var i = 0; i < _allRecords.length; i++) {
        _records[_allRecords[i].id] = _allRecords[i]
      }
      setRecords(_records)
      setSaltModal(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsState])

  // Sets signature from Wagmi signMessage() as S_IPNS(K_WALLET)
  React.useEffect(() => {
    if (signature) {
      if (sigCount === 1 && !keypair[0]) {
        setMessage('Generating Signer')
        const keygen = async () => {
          const _origin = `eth:${_Wallet_ || constants.zeroAddress}`
          const __keypair = await KEYGEN(_origin, caip10, signature, saltModalState.modalData)
          setKeypair(__keypair)
          setMessage('Signer Generated')
        }
        keygen()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, sigCount, keypair])

  // Sets signature status
  React.useEffect(() => {
    if (signLoading) {
      setLoading(true)
      setMessage(sigCount === 1 ? 'Waiting for Signer Signature' : 'Waiting for Approval Signature')
    }
    if (signError) {
      setMessage('Signature Failed')
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signLoading, signError, sigCount])

  /* HANDLE WRITING RECORDS */
  // Handles writing records to the NameSys backend
  React.useEffect(() => {
    let _records = { ...records }
    let count = countVal(_records)
    if (
      write &&
      count > 0
    ) {
      setLoading(true)
      let newValues: any = {}
      let newKeys: string[] = []
      for (var key = 0; key < _records.length; key++) {
        if (_records[key].new !== '') {
          newValues[key] = _records[key].new
          newKeys.push(_records[key].name)
        }
      }
      // Generate POST request for writing records
      const request = {
        user: _Wallet_ || constants.zeroAddress,
        ipns: newKeys,
        ipfs: newValues
      }
      const editRecord = async () => {
        setMessage('Writing Records')
        try {
          await fetch(
            `${SERVER}:${PORT}/write`,
            {
              method: "post",
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(request)
            })
            .then(response => response.json())
            .then(async data => {
              if (data.response) {
                // Get gas consumption estimate

              }
            })
        } catch (error) {
          console.error('ERROR:', 'Failed to write to CCIP2 backend')
          setMessage('Record Update Failed')
          setCrash(true)
          setLoading(false)
          setColor('orangered')
        }
      }
      editRecord()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [write, meta])

  return (
    <>
      <Head>
        <title>NameSys IPNS Pinning Service</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className='flex-column'>
        <div style={{ fontFamily: 'SF Mono' }}></div>
        <div style={{ fontFamily: 'Spotnik' }}></div>
        <div style={{ marginTop: mobile ? '23.5%' : '7.5%' }}></div>
        {/* HOME */}
        {!user && (
          <div className='flex-column'>
            <div className='flex-column'>
              <img
                alt='logo'
                src='logo.png'
                width={mobile ? '220px' : '350px'}
                style={{ marginBottom: '-10px' }}
              />
              <div className='flex-column'>
                <h1 style={{ color: '#ff2600' }}>
                </h1>
                <h4 style={{ color: '#fc4e14', marginTop: '-20px' }}>
                  Keyless Pinning Service
                </h4>
              </div>
            </div>
            <div
              className={mobile ? 'emphasis' : 'emphasis-large'}
              style={{ margin: mobile ? '60px 0 60px 0' : '90px 0 120px 0' }}
            >
              <ConnectButton
                label='Login ♦'
              />
            </div>
            <div className={styles.grid} style={{ marginTop: '50px' }}>
              <a
                href=""
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h1 style={{ fontSize: '24px' }}>
                  DOCS <span className="material-icons micon">library_books</span>
                </h1>
                <p>Learn More</p>
              </a>

              <a
                href=""
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h1 style={{ fontSize: '24px' }}>
                  CODE <span className="material-icons micon">developer_mode</span>
                </h1>
                <p>Source Codes</p>
              </a>
            </div>
            <div
              className="flex-column"
              style={{
                paddingBottom: '10px',
                marginTop: mobile ? '60px' : '100px'
              }}
            >
              <span
                style={{
                  color: 'grey',
                  fontWeight: '700',
                  fontSize: mobile ? '12px' : '14px',
                  paddingBottom: '5px'
                }}
              >
                {'Funded By'}
              </span>
              <span
                style={{
                  color: 'skyblue',
                  fontWeight: '700',
                  fontSize: mobile ? '14px' : '16px'
                }}
              >
                {'ENS DAO'}
              </span>
            </div>
          </div>
        )}
        {/* PROFILE */}
        {user && (
          <div>
            {loading && (
              <div className='flex-column'>
                <div style={{ marginTop: '175px' }}>
                  <Loading
                    height={50}
                    width={50}
                  />
                </div>
                <div
                  style={{
                    marginTop: '20px'
                  }}
                >
                  <span
                    style={{
                      color: '#fc6603',
                      fontSize: '24px',
                      fontWeight: '700'
                    }}
                  >
                    {message}
                  </span>
                </div>
                <div
                  style={{
                    marginTop: '20px'
                  }}
                >
                  <span
                    style={{
                      color: 'white',
                      fontSize: '24px',
                      fontWeight: '700',
                      fontFamily: 'SF Mono'
                    }}
                  >
                    {sigCount > 0 ? `${sigCount}/1` : ''}
                  </span>
                </div>
              </div>
            )}
            {!loading && (
              <div className="flex-column-sans-align">
                <div style={{ marginTop: mobile ? '-2%' : '-12%', marginLeft: mobile ? '60%' : '90%' }}>
                  <div style={{ width: '350px' }}>
                    <ConnectButton
                      label='wallet'
                    />
                  </div>
                </div>
                <div className='flex-column' style={{ opacity: 0.35, marginTop: !mobile ? '-2%' : '10%' }}>
                  <img
                    alt='logo'
                    src='logo.png'
                    width={'175px'}
                    style={{ marginBottom: '-15px' }}
                  />
                  <div className='flex-column' style={{ marginTop: !mobile ? '-1%' : '-2%' }}>
                    <h4 style={{ color: '#ff2600' }}>
                    </h4>
                    <h4 style={{ color: '#fc4e14', marginTop: '-25px' }}>
                      Keyless Pinning Service
                    </h4>
                  </div>
                </div>
                <div className={!mobile ? 'flex-column-sans-align' : 'flex-column'} style={{ margin: '10px 0 0 0' }}>
                  <div className={!mobile ? 'flex-column-sans-align' : 'flex-column'} style={{ margin: !mobile ? '10px 0 40px 20px' : '10px 0 20px 0' }}>
                    <img
                      alt="logo"
                      src={meta.avatar || 'profile.png'}
                      onError={(event) => {
                        (event.target as any).onerror = null;
                        (event.target as any).src = 'profile.png';
                      }}
                      width={'120px'}
                      style={{ margin: !mobile ? '0 15px -3px 0' : '-30px 15px 15px 0' }}
                    />
                    <div
                      className={!mobile ? 'flex-row' : 'flex-column'}
                      style={{
                        alignItems: 'flex-start',
                        margin: mobile ? '5px 0 0 0' : '0 0 0 0',
                      }}
                    >
                      <div
                        className={!mobile ? 'flex-row' : 'flex-row'}
                        style={{
                          margin: !mobile ? '-3.95% 0 0 -13%' : '0 0 0 0',
                          color: '#ff2600'
                        }}
                      >
                        <div
                          className="flex-column"
                          style={{
                            alignItems: 'flex-end',
                            lineHeight: '20px',
                            marginTop: '-5px'
                          }}
                        >
                          <div>
                            <span>{'Welcome'}</span>
                          </div>
                        </div>
                        <div
                          style={{
                            marginLeft: '5px',
                            lineHeight: '23.5px',
                          }}
                        >
                          <div style={{ margin: '-3px 0 1px 0' }}>
                            <span
                              className='mono'
                              id="metaManager"
                              onClick={() => constants.copyToClipboard(meta.user, "none", "metaManager")}
                            >
                              {mobile ? constants.truncateHexString(meta.user) : meta.user}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={!mobile ? 'flex-column-sans-align' : 'flex-column'}>
                    <div>
                      <Records
                        meta={meta}
                        handleModalData={handleRecordsData}
                        handleTrigger={handleRecordsTrigger}
                        records={Object.values(records)}
                        hue={!_Wallet_ ? 'white' : 'orange'}
                      />
                      <Salt
                        handleTrigger={handleSaltTrigger}
                        handleModalData={handleSaltModalData}
                        onClose={() => {
                          setSaltModal(false)
                        }}
                        show={saltModal}
                      >
                        {[String(_Wallet_), 'gateway']}
                      </Salt>
                      <Success
                        color={color}
                        icon={'check_circle_outline'}
                        onClose={() => setSuccessModal(false)}
                        show={successModal}
                        handleTrigger={handleSuccessTrigger}
                        handleModalData={handleSuccessModalData}
                      >
                        {success}
                      </Success>
                      <Error
                        onClose={() => {
                          setCrash(false)
                        }}
                        color={color}
                        show={crash && !loading}
                        title={'cancel'}
                      >
                        {message}
                      </Error>
                    </div>
                  </div>
                </div>
                <div className={!mobile ? `${styles.grid} flex-column` : `flex-column`} style={{ margin: !mobile ? '180px 0 0 0' : '20px 0 0 0' }}>
                  <a
                    href=""
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ margin: '0 auto' }}
                  >
                    <h1 style={{ fontSize: '20px' }}>
                      DOCS <span className="material-icons micon">library_books</span>
                    </h1>
                    <p>Learn More</p>
                  </a>

                  <a
                    href=""
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ margin: '0 auto' }}
                  >
                    <h1 style={{ fontSize: '20px' }}>
                      CODE <span className="material-icons micon">developer_mode</span>
                    </h1>
                    <p>Source Codes</p>
                  </a>
                </div>
                <div
                  className="flex-column"
                  style={{
                    paddingTop: '30px'
                  }}
                >
                  <span
                    style={{
                      color: 'grey',
                      fontWeight: '700',
                      fontSize: mobile ? '10px' : '14px',
                      paddingBottom: '5px'
                    }}
                  >
                    {'Funded By'}
                  </span>
                  <span
                    style={{
                      color: 'skyblue',
                      fontWeight: '700',
                      fontSize: mobile ? '12px' : '16px'
                    }}
                  >
                    {'ENS DAO'}
                  </span>
                </div>
                <div id='none' style={{ marginTop: '2.5%' }}></div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  )
}
