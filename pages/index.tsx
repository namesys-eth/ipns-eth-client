import Head from "next/head";
import React from "react";
import styles from "./page.module.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ethers } from "ethers";
import * as constants from "../utils/constants";
import { isMobile } from "react-device-detect";
import Loading from "../components/LoadingColors";
import Records from "../components/Records";
import Success from "../components/Success";
import ErrorModal from "../components/Error";
import { useWindowDimensions } from "../hooks/useWindowDimensions";
import { useAccount } from "wagmi";
import * as secp256k1 from "@noble/secp256k1";
import * as Name from "w3name";
import * as Nam3 from "@namesys-eth/w3name-client";

export default function Home() {
  const { width, height } = useWindowDimensions(); // Get window dimensions
  const [mobile, setMobile] = React.useState(false); // Set mobile or dekstop environment
  const [write, setWrite] = React.useState(false); // Sets write flag
  const [color, setColor] = React.useState("lime"); // Set color
  const [crash, setCrash] = React.useState(false); // Set crash status
  const [user, setUser] = React.useState(""); // Sets connected user
  const [success, setSuccess] = React.useState(""); // Sets success text for the Success modal
  const [successModal, setSuccessModal] = React.useState(false); // Success modal trigger
  const [message, setMessage] = React.useState("Loading"); // Set message to display
  const [records, setRecords] = React.useState(constants.makeRecords(4)); // Set records
  const [meta, setMeta] = React.useState(constants.meta); // Set ENS metadata
  const [loading, setLoading] = React.useState(true); // Loading Records marker
  const [history, setHistory] = React.useState(constants.EMPTY_HISTORY_RECORDS); // Record history from last update
  const [queue, setQueue] = React.useState<number[]>([]); // Sets queue countdown between successive updates
  const [recordsState, setRecordsState] =
    React.useState<constants.MainBodyState>(constants.modalTemplate); // Records body state
  const [successModalState, setSuccessModalState] =
    React.useState<constants.MainSuccessState>(constants.modalSuccessTemplate);
  // Variables
  const chain = process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? "1" : "5";
  const { Revision } = Name; // W3Name Revision object
  const { address: _Wallet_ } = useAccount();
  const apiKey =
    chain === "1"
      ? process.env.NEXT_PUBLIC_ALCHEMY_ID_MAINNET
      : process.env.NEXT_PUBLIC_ALCHEMY_ID_GOERLI;
  const network = chain === "1" ? "mainnet" : "goerli";
  const provider = new ethers.AlchemyProvider(network, apiKey);
  const alchemyEndpoint = `https://eth-${network}.g.alchemy.com/v2/` + apiKey;

  // Handle Records body data return
  const handleRecordsData = (data: string) => {
    setRecordsState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Records body trigger
  const handleRecordsTrigger = (trigger: boolean) => {
    setRecordsState((prevState) => ({ ...prevState, trigger: trigger }));
  };

  // Handle Success modal data return
  const handleSuccessModalData = (data: string | undefined) => {
    setSuccessModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Success modal trigger
  const handleSuccessTrigger = (trigger: boolean) => {
    setSuccessModalState((prevState) => ({ ...prevState, trigger: trigger }));
  };

  // FUNCTIONS
  // Get Avatar
  async function getAvatar(wallet: any) {
    const _meta = { ...meta };
    try {
      const _ENS = await provider.lookupAddress(String(wallet));
      const _avatar = _ENS ? await provider.getAvatar(_ENS) : null;
      if (_avatar || _ENS) {
        _meta.user = String(wallet);
        _meta.avatar = _avatar || "";
        _meta.ens = _ENS || "";
        setMeta(_meta);
        return _avatar;
      } else {
        _meta.user = String(wallet);
        setMeta(_meta);
        return "";
      }
    } catch (error) {
      _meta.user = String(wallet);
      setMeta(_meta);
      return "";
    }
  }

  // Get records from history on backend
  // Must get Revision for IPNS update
  async function getUpdate(wallet: string, useQueue: boolean) {
    const request = {
      user: String(wallet),
    };
    try {
      await fetch(`${constants.SERVER}:${constants.PORT}/read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })
        .then((response) => response.json())
        .then((data) => {
          let _history = {
            type: "history",
            data: data.response.data,
          };
          setHistory(_history);
          let _queue = [];
          for (let i = 0; i < _history.data.ipns.length; i++) {
            if (data.response.data.timestamp[i]) {
              _queue.push(
                Math.round(Date.now() / 1000) -
                  Number(data.response.data.timestamp[i]) -
                  constants.waitingPeriod
              );
            } else {
              _queue.push(0);
            }
          }
          if (useQueue) setQueue(_queue);
        });
    } catch (error) {
      console.error("ERROR:", "Failed to read from IPNS.eth backend");
    }
  }

  // Function for resetting IPNS key on NameSys backend
  async function doClean(ipns: string[]) {
    const request = {
      ipns: ipns,
    };
    try {
      await fetch(`${constants.SERVER}:${constants.PORT}/clean`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })
        .then((response) => response.json())
        .then(async (data) => {
          if (data.response.status) {
            setMessage("Meta Reset Successful");
            setTimeout(() => {
              setLoading(false);
            }, 2000);
          } else {
            console.error("ERROR:", "Failed to reset meta on IPNS.eth backend");
            setTimeout(() => {
              setLoading(false);
            }, 2000);
            setLoading(false);
            setMessage("Meta Reset Failed");
            setCrash(true);
          }
        });
    } catch (error) {
      console.error("ERROR:", "Failed to reset meta on IPNS.eth backend");
      setMessage("Meta Reset Failed");
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      setCrash(true);
    }
  }

  // Function for writing IPNS Revision metadata to NameSys backend; needed for updates
  async function writeRevision(
    revision: Name.Revision[],
    timestamp: number[],
    ipns: string[],
    ipfs: string[],
    name: string[],
    sequence: number[]
  ) {
    let __revision: any = [];
    let ___encoded: any = [];
    for (var i = 0; i < revision.length; i++) {
      let _revision_: any = {};
      if (revision.length > 0 && revision[i]) {
        const _revision = JSON.parse(
          JSON.stringify(revision[i], (key, value) => {
            return typeof value === "bigint" ? String(value) : value;
          })
        );
        if (_revision._name._privKey) _revision._name._privKey._key = {};
        _revision_ = JSON.stringify(_revision);
      } else {
        _revision_ = JSON.stringify(_revision_);
      }
      __revision.push(_revision_);
      ___encoded.push(Revision.encode(revision[i]));
    }
    const request = {
      user: _Wallet_,
      revision: revision.length > 0 ? ___encoded : [{}],
      ipns: ipns,
      ipfs: ipfs,
      name: name,
      sequence: sequence,
      version: __revision,
      timestamp: timestamp,
    };
    try {
      await fetch(`${constants.SERVER}:${constants.PORT}/revision`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })
        .then((response) => response.json())
        .then(async (data) => {
          if (data.response.status) {
            return data.response.status === "true";
          } else {
            return false;
          }
        });
    } catch (error) {
      console.error("ERROR:", "Failed to write Revision to IPNS.eth backend");
      setMessage("Revision Update Failed");
      setCrash(true);
      setColor("orangered");
      doCrash();
    }
  }

  // Finish updating records
  function doSuccess(
    ipns: string[],
    timestamp: number[],
    _records: typeof records,
    _history: typeof history
  ) {
    setLoading(false);
    setWrite(false);
    for (const key in _records) {
      if (_records[key].new) {
        let _index = ipns.indexOf(_records[key].ipns);
        // Update local records after write
        _records[key].ipfs = _records[key].new;
        _records[key].sequence = _records[key].sequence + 1;
        _records[key].new = "";
        _records[key].timestamp = timestamp[_index];
      }
    }
    setRecords(_records);
    getUpdate(String(_Wallet_), true);
  }

  // Finish crashing and resetting
  function doCrash() {
    setLoading(false);
    setWrite(false);
    let _records = { ...records };
    for (const key in _records) {
      if (_records[key].new) {
        _records[key].new = "";
      }
    }
    setRecords(_records);
  }

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true);
    }
    getUpdate(String(_Wallet_), true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, _Wallet_]);

  React.useEffect(() => {
    if (_Wallet_ && String(_Wallet_) !== constants.zeroAddress) {
      setUser(_Wallet_);
      getAvatar(_Wallet_);
    } else {
      setUser("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_Wallet_]);

  // Set Records to write
  React.useEffect(() => {
    if (recordsState.trigger && recordsState.modalData) {
      let _allRecords = JSON.parse(recordsState.modalData);
      let _records = { ...records };
      for (var i = 0; i < _allRecords.length; i++) {
        _records[_allRecords[i].id] = _allRecords[i];
      }
      setRecords(_records);
      setWrite(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordsState]);

  // Trigger page refresh upon success
  React.useEffect(() => {
    if (successModalState.trigger && successModalState.modalData) {
      setSuccessModalState(constants.modalSuccessTemplate);
      setMessage("Refreshing Records");
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      //window.location.reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successModalState]);

  /* HANDLE WRITING RECORDS */
  // Handles writing records to the NameSys backend
  React.useEffect(() => {
    let _records = { ...records };
    let count = constants.countVal(_records);
    if (write && count > 0) {
      setLoading(true);
      let newIPFS: string[] = [];
      let newIPNS: string[] = [];
      let newName: string[] = [];
      let newTimestamp: number[] = [];
      let newSequence: number[] = [];
      let newENS: string[] = [];
      let newHidden: string[] = [];
      let newAuthority: string[] = [];
      let newRevision: Name.Revision[] = [];
      let newEncoded: any[] = [];
      for (const key in _records) {
        if (
          _records.hasOwnProperty(key) &&
          constants.isGoodValue("contenthash", _records[key].new)
        ) {
          newIPFS.push(_records[key].new);
          newIPNS.push(_records[key].ipns);
          newName.push(_records[key].name);
          newTimestamp.push(Math.round(Date.now() / 1000));
          newENS.push(_records[key].ens);
          newHidden.push(_records[key].hidden ? "1" : "0");
          newSequence.push(_records[key].sequence + 1);
          newAuthority.push(_records[key].authority);
        }
      }
      // Generate POST request for writing records
      const request = {
        user: _Wallet_ || constants.zeroAddress,
        ipns: newIPNS,
        ipfs: newIPFS,
        timestamp: newTimestamp,
        name: newName,
        ens: newENS,
        hidden: newHidden,
      };
      const editRecord = async () => {
        setMessage("Writing IPNS Records");
        try {
          await fetch(`${constants.SERVER}:${constants.PORT}/write`, {
            method: "post",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
          })
            .then((response) => response.json())
            .then(async (data) => {
              if (data.response) {
                if (data.response.status) {
                  setMessage("Successfully Indexed IPNS Records");
                  // Handle revision
                  let allSuccess: boolean = false;
                  for (var k = 0; k < newIPNS.length; k++) {
                    let key = newAuthority[k];
                    let w3name: Name.WritableName;
                    let w3nam3: Nam3.WritableName;
                    w3name = await Name.from(secp256k1.utils.hexToBytes(key));
                    w3nam3 = await Nam3.from(secp256k1.utils.hexToBytes(key));
                    const toPublish = "/ipfs/" + newIPFS[k].split("ipfs://")[1];
                    // @W3Name broadcast
                    let _revision: Name.Revision;
                    let revision_: Nam3.Revision;
                    let _index = history.data.ipns.indexOf(
                      newIPNS[k].split("ipns://")[1]
                    );
                    if (_index >= 0) {
                      let _revision_ = Revision.decode(
                        new Uint8Array(
                          history.data.revision[_index].split(",").map(Number)
                        )
                      );
                      _revision = await Name.increment(_revision_, toPublish);
                      revision_ = await Nam3.increment(_revision_, toPublish);
                    } else {
                      _revision = await Name.v0(w3name, toPublish);
                      revision_ = await Nam3.v0(w3nam3, toPublish);
                    }
                    await Name.publish(_revision, w3name.key);
                    //await Nam3.publish(revision_, w3nam3.key);
                    // [!!!] _revision === revision_
                    // [!!!] DO NOT REMOVE LOG
                    console.log(
                      "State:",
                      JSON.stringify(Revision.encode(_revision)) ===
                        JSON.stringify(Revision.encode(revision_))
                    );
                    if (
                      JSON.stringify(Revision.encode(_revision)) ===
                      JSON.stringify(Revision.encode(revision_))
                    ) {
                      newRevision.push(_revision);
                      newEncoded.push(Revision.encode(_revision));
                      allSuccess = true;
                      setMessage("Successfully Updated IPNS Records");
                      setColor("lime");
                      setSuccess("Successfully Updated IPNS Records");
                      setSuccessModal(true);
                    } else {
                      allSuccess = false;
                      await doClean(newIPNS);
                      setMessage("Failed Update due to Metadata Divergence");
                      setCrash(true);
                      setColor("orangered");
                      doCrash();
                    }
                  }
                  if (allSuccess) {
                    await writeRevision(
                      newRevision,
                      newTimestamp,
                      newIPNS,
                      newIPFS,
                      newName,
                      newSequence
                    );
                    doSuccess(newIPNS, newTimestamp, records, history);
                  }
                } else {
                  await doClean(newIPNS);
                  setMessage("Failed to Update IPNS Records");
                  setCrash(true);
                  setColor("orangered");
                  doCrash();
                }
              }
            });
        } catch (error) {
          console.error("ERROR:", "Failed to write to IPNS.eth backend");
          await doClean(newIPNS);
          setMessage("IPNS Record Update Failed");
          setCrash(true);
          setColor("orangered");
          doCrash();
        }
      };
      editRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [write, meta, records, history]);

  return (
    <>
      <Head>
        <title>NameSys IPNS Pinning Service</title>
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <main className="flex-column">
        <div style={{ fontFamily: "SF Mono" }}></div>
        <div style={{ fontFamily: "Spotnik" }}></div>
        <div style={{ marginTop: mobile ? "50px" : "125px" }}></div>
        {/* HOME */}
        {!user && (
          <div className="flex-column">
            <div className="flex-column">
              <img
                alt="logo"
                src="logo.png"
                width={mobile ? "220px" : "350px"}
                style={{ marginBottom: "-10px" }}
              />
              <div className="flex-column">
                <h1 style={{ color: "#ff2600" }}></h1>
                <h4 style={{ color: "#fc4e14", marginTop: "-20px" }}>
                  Keyless Pinning Service
                </h4>
              </div>
            </div>
            <div
              className={
                mobile
                  ? "emphasis flex-row home-button"
                  : "emphasis-large flex-row home-button"
              }
              style={{
                margin: mobile ? "60px 0 60px 0" : "90px 0 120px 0",
              }}
            >
              <ConnectButton label="Login &nbsp;&nbsp;&nbsp;&nbsp;" />
              <div
                className="material-icons-round"
                style={{
                  color: "white",
                  margin: "-7px 5px 0 -30px",
                }}
              >
                <span style={{ fontSize: "20px" }}>cabin</span>
              </div>
            </div>
            <div className={styles.grid} style={{ marginTop: "50px" }}>
              <a
                href="https://github.com/namesys-eth/ipns-eth-resources/blob/main/docs/README.md"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h1 style={{ fontSize: "24px" }}>
                  DOCS{" "}
                  <span className="material-icons micon">library_books</span>
                </h1>
                <p>Learn More</p>
              </a>

              <a
                href="https://github.com/namesys-eth/ipns-eth-client"
                className={styles.card}
                target="_blank"
                rel="noopener noreferrer"
              >
                <h1 style={{ fontSize: "24px" }}>
                  CODE{" "}
                  <span className="material-icons micon">developer_mode</span>
                </h1>
                <p>Source Codes</p>
              </a>
            </div>
            <div
              className="flex-column"
              style={{
                paddingBottom: "10px",
                marginTop: mobile ? "60px" : "100px",
              }}
            >
              <span
                style={{
                  color: "grey",
                  fontWeight: "700",
                  fontSize: mobile ? "12px" : "14px",
                  paddingBottom: "5px",
                }}
              >
                {"Funded By"}
              </span>
              <span
                style={{
                  color: "skyblue",
                  fontWeight: "700",
                  fontSize: mobile ? "14px" : "16px",
                }}
              >
                {"ENS DAO"}
              </span>
            </div>
          </div>
        )}
        {/* PROFILE */}
        {user && (
          <div>
            {loading && (
              <div className="flex-column">
                <div style={{ marginTop: "175px" }}>
                  <Loading height={50} width={50} />
                </div>
                <div
                  style={{
                    marginTop: "20px",
                  }}
                >
                  <span
                    style={{
                      color: "#fc6603",
                      fontSize: "24px",
                      fontWeight: "700",
                    }}
                  >
                    {message}
                  </span>
                </div>
              </div>
            )}
            {!loading && (
              <div className="flex-column-sans-align">
                <div
                  style={{
                    marginTop: mobile ? "-2%" : "-12%",
                    marginLeft: mobile ? "60%" : "90%",
                  }}
                >
                  <div style={{ minWidth: "400px" }}>
                    <ConnectButton label="wallet" />
                  </div>
                </div>
                <div
                  className="flex-column"
                  style={{ opacity: 1, marginTop: !mobile ? "-2%" : "10%" }}
                >
                  <img
                    alt="logo"
                    src="logo.png"
                    width={"175px"}
                    style={{ marginBottom: "-15px" }}
                  />
                  <div
                    className="flex-column"
                    style={{ marginTop: !mobile ? "-1%" : "-2%" }}
                  >
                    <h4 style={{ color: "#ff2600" }}></h4>
                    <h4 style={{ color: "#fc4e14", marginTop: "-25px" }}>
                      Keyless Pinning Service
                    </h4>
                  </div>
                </div>
                <div
                  className={!mobile ? "flex-column-sans-align" : "flex-column"}
                  style={{ margin: "10px 0 0 0" }}
                >
                  <div
                    className={
                      !mobile ? "flex-column-sans-align" : "flex-column"
                    }
                    style={{
                      margin: !mobile ? "10px 0 40px 20px" : "10px 0 20px 0",
                    }}
                  >
                    <img
                      alt="logo"
                      src={meta.avatar || "profile.png"}
                      onError={(event) => {
                        (event.target as any).onerror = null;
                        (event.target as any).src = "profile.png";
                      }}
                      width={"120px"}
                      style={{
                        margin: !mobile ? "0 15px -3px 0" : "-30px 15px 15px 0",
                      }}
                    />
                    <div
                      className={!mobile ? "flex-row" : "flex-column"}
                      style={{
                        alignItems: "flex-start",
                        margin: mobile ? "5px 0 0 0" : "0 0 0 0",
                      }}
                    >
                      <div
                        className={
                          !mobile
                            ? meta.ens
                              ? "flex-row"
                              : "flex-column-align-left"
                            : "flex-column"
                        }
                        style={{
                          margin: !mobile
                            ? `-14.55% 0 0 ${meta.ens ? "-30%" : "-7%"}`
                            : "0 0 0 -5%",
                          color: "#ff2600",
                        }}
                      >
                        <div
                          className="flex-column"
                          style={{
                            alignItems: "flex-end",
                            lineHeight: "20px",
                            marginTop: !mobile ? "0" : "-5px",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: !mobile ? "17px" : "16px",
                              }}
                            >
                              {"Welcome"}
                            </span>
                          </div>
                        </div>
                        <div
                          style={{
                            marginLeft: meta.ens && !mobile ? "10px" : "0",
                            marginTop: !mobile ? "5px" : "5px",
                            lineHeight: "23.5px",
                          }}
                        >
                          <div style={{ margin: "-5px 0 1px 0" }}>
                            <span
                              className="mono"
                              id="metaManager"
                              onClick={() =>
                                constants.copyToClipboard(
                                  meta.user,
                                  "none",
                                  "metaManager"
                                )
                              }
                              style={{
                                fontSize: meta.ens && !mobile ? "22px" : "18px",
                              }}
                            >
                              {mobile
                                ? meta.ens
                                  ? meta.ens
                                  : constants.truncateHexString(meta.user)
                                : meta.ens
                                ? meta.ens
                                : meta.user}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div
                    className={
                      !mobile ? "flex-column-sans-align" : "flex-column"
                    }
                    style={{
                      marginTop: "-20px",
                    }}
                  >
                    <div>
                      <Records
                        meta={meta}
                        handleModalData={handleRecordsData}
                        handleTrigger={handleRecordsTrigger}
                        records={Object.values(records)}
                        historical={history}
                        longQueue={queue}
                      />
                      <Success
                        color={color}
                        icon={"energy_savings_leaf"}
                        onClose={() => setSuccessModal(false)}
                        show={successModal}
                        handleTrigger={handleSuccessTrigger}
                        handleModalData={handleSuccessModalData}
                      >
                        {success}
                      </Success>
                      <ErrorModal
                        onClose={() => {
                          setCrash(false);
                        }}
                        color={color}
                        show={crash && !loading}
                        title={"cancel"}
                      >
                        {message}
                      </ErrorModal>
                    </div>
                  </div>
                </div>
                <div
                  className={
                    !mobile ? `${styles.grid} flex-column` : `flex-column`
                  }
                  style={{ margin: !mobile ? "30px 0 0 0" : "20px 0 0 0" }}
                >
                  <a
                    href="https://github.com/namesys-eth/ipns-eth-resources/blob/main/docs/README.md"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ margin: "0 auto" }}
                  >
                    <h1 style={{ fontSize: "20px" }}>
                      DOCS{" "}
                      <span className="material-icons micon">
                        library_books
                      </span>
                    </h1>
                    <p>Learn More</p>
                  </a>

                  <a
                    href="https://github.com/namesys-eth/ipns-eth-client"
                    className={styles.card}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ margin: "0 auto" }}
                  >
                    <h1 style={{ fontSize: "20px" }}>
                      CODE{" "}
                      <span className="material-icons micon">
                        developer_mode
                      </span>
                    </h1>
                    <p>Source Codes</p>
                  </a>
                </div>
                <div
                  className="flex-column"
                  style={{
                    paddingTop: "30px",
                  }}
                >
                  <span
                    style={{
                      color: "grey",
                      fontWeight: "700",
                      fontSize: mobile ? "10px" : "14px",
                      paddingBottom: "5px",
                    }}
                  >
                    {"Funded By"}
                  </span>
                  <span
                    style={{
                      color: "skyblue",
                      fontWeight: "700",
                      fontSize: mobile ? "12px" : "16px",
                    }}
                  >
                    {"ENS DAO"}
                  </span>
                  <div
                    style={{
                      marginTop: !mobile ? "15px" : "10px",
                      color: "#ff2600b3",
                      fontFamily: "SF Mono",
                      fontSize: !mobile ? "15px" : "14px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Spotnik",
                        fontSize: !mobile ? "10px" : "9px",
                        fontWeight: "700",
                        marginRight: "2px",
                      }}
                    >
                      {"v"}
                    </span>
                    {"1.0"}
                    <span
                      style={{
                        fontFamily: "Spotnik",
                        fontSize: !mobile ? "13px" : "12px",
                        fontWeight: "700",
                        marginLeft: "2px",
                      }}
                    >
                      {"-beta"}
                    </span>
                  </div>
                </div>
                <div id="none" style={{ marginTop: "2.5%" }}></div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
