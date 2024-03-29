import React from "react";
import Link from "next/link";
import styles from "../pages/page.module.css";
import { isMobile } from "react-device-detect";
import { useWindowDimensions } from "../hooks/useWindowDimensions";
import * as constants from "../utils/constants";
import { ethers } from "ethers";
import Help from "../components/Help";
import Salt from "../components/Salt";
import Loading from "../components/LoadingColors";
import NameModal from "../components/Name";
import EnsModal from "../components/ENS";
import ErrorModal from "../components/Error";
import { KEYGEN } from "../utils/keygen";
import Web3 from "web3";
import * as secp256k1 from "@noble/secp256k1";
import * as Name from "w3name";

import { useAccount, useSignMessage } from "wagmi";
import DeleteModal from "./Delete";

interface RecordsContainerProps {
  meta: any;
  records: any[];
  longQueue: number[];
  historical: typeof constants.EMPTY_HISTORY_RECORDS;
  handleModalData: (data: string) => void;
  handleTrigger: (data: boolean) => void;
}

const Records: React.FC<RecordsContainerProps> = ({
  meta,
  records,
  longQueue,
  historical,
  handleModalData,
  handleTrigger,
}) => {
  const _Length = constants.countLegitInHistory(
    historical.data.ipns,
    historical.data.hidden,
    historical.data.revision
  );
  const _Hidden = constants.countHiddenInHistory(
    historical.data.ipns,
    historical.data.hidden,
    historical.data.revision
  );
  const { address: _Wallet_ } = useAccount();
  const [helpModal, setHelpModal] = React.useState(false); // Help modal
  const [help, setHelp] = React.useState(""); // Set help
  const [crash, setCrash] = React.useState(false); // Set crash status
  const [progress, setProgress] = React.useState(-1); // Sets index of record in process
  const [trigger, setTrigger] = React.useState(-1); // Stores trigger for side action
  const [skip, setSkip] = React.useState(-1); // Skips meta update to backend
  const [message, setMessage] = React.useState("Loading"); // Set message to display
  const [loading, setLoading] = React.useState(false); // Loading Records marker
  const [saltModal, setSaltModal] = React.useState(-1); // Salt (password/key-identifier) modal
  const [sigCount, setSigCount] = React.useState(0); // Set signature count
  const [CID, setCID] = React.useState(""); // IPNS pubkey/CID value
  const [inputValue, setInputValue] = React.useState(
    _Length < 5
      ? constants.makeRecords(4 + _Hidden)
      : constants.makeRecords(_Length + _Hidden)
  ); // Input state
  const [mobile, setMobile] = React.useState(false); // Mobioe device
  const [nameModal, setNameModal] = React.useState(-1); // Edit name modal
  const [ensModal, setEnsModal] = React.useState(-1); // Edit ENS modal
  const [deleteModal, setDeleteModal] = React.useState(-1); // Delete IPNS modal
  const [keypair, setKeypair] = React.useState<[string, string]>(["", ""]); // Sets generated K_IPNS keys
  const [nameModalState, setNameModalState] =
    React.useState<constants.MainBodyState>(constants.modalTemplate); // Name modal state
  const [ensModalState, setEnsModalState] =
    React.useState<constants.MainBodyState>(constants.modalTemplate); // ENS modal state
  const [deleteModalState, setDeleteModalState] =
    React.useState<constants.MainBoolState>(constants.modalBoolTemplate); // ENS modal state
  const [saltModalState, setSaltModalState] =
    React.useState<constants.MainSaltState>(constants.modalSaltTemplate); // Salt modal state
  const { width, height } = useWindowDimensions();

  // Variables
  const chain = process.env.NEXT_PUBLIC_NETWORK === "mainnet" ? "1" : "5";
  const apiKey =
    chain === "1"
      ? process.env.NEXT_PUBLIC_ALCHEMY_ID_MAINNET
      : process.env.NEXT_PUBLIC_ALCHEMY_ID_GOERLI;
  const network = chain === "1" ? "mainnet" : "goerli";
  const provider = new ethers.AlchemyProvider(network, apiKey);
  const alchemyEndpoint = `https://eth-${network}.g.alchemy.com/v2/` + apiKey;
  const web3 = new Web3(alchemyEndpoint);
  const recoveredAddress = React.useRef<string>();
  const caip10 = `eip155:${chain}:${_Wallet_}`; // CAIP-10

  // Handle Name modal data return
  const handleNameModalData = (data: string) => {
    setNameModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Name modal trigger
  const handleNameTrigger = (trigger: boolean) => {
    setNameModalState((prevState) => ({ ...prevState, trigger: trigger }));
  };
  // Handle ENS modal data return
  const handleEnsModalData = (data: string) => {
    setEnsModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle ENS modal trigger
  const handleEnsTrigger = (trigger: boolean) => {
    setEnsModalState((prevState) => ({ ...prevState, trigger: trigger }));
  };
  // Handle Delete modal data return
  const handleDeleteModalData = (data: boolean) => {
    setDeleteModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Delete modal trigger
  const handleDeleteTrigger = (trigger: boolean) => {
    setDeleteModalState((prevState) => ({ ...prevState, trigger: trigger }));
  };
  // Handle Salt modal data return
  const handleSaltModalData = (data: string) => {
    setSaltModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Salt modal trigger
  const handleSaltTrigger = (trigger: boolean) => {
    setSaltModalState((prevState) => ({ ...prevState, trigger: trigger }));
  };

  // Whether connector is authorised to write
  function unauthorised() {
    return !_Wallet_;
  }

  // Finish updating one record
  function doFinish() {
    setSigCount(0);
    setKeypair(["", ""]);
    setCID("");
  }

  // Gets live value of update
  function getVal(id: string, type: string) {
    return type === "ipns"
      ? inputValue[inputValue.findIndex((_record: any) => _record.id === id)]
          .ipns
      : type === "ipfs"
      ? inputValue[inputValue.findIndex((_record: any) => _record.id === id)]
          .new
      : inputValue[inputValue.findIndex((_record: any) => _record.id === id)]
          .name;
  }

  // Get inactive values in records
  function inactiveValues(_inputValue: typeof inputValue) {
    let index = [];
    for (let i = 0; i < _inputValue.length; i++) {
      if (!_inputValue[i].new) {
        index.push(_inputValue[i].id);
      }
    }
    return index;
  }

  // Function for writing IPNS meta to NameSys backend
  async function writeMeta(index: number, type: string, updated: string) {
    const request = {
      ipns: [inputValue[index].ipns],
      ens: type === "ens" ? [updated] : [""],
      hidden: type === "hidden" ? [updated] : [""],
    };
    try {
      await fetch(`${constants.SERVER}:${constants.PORT}/meta`, {
        method: "post",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      })
        .then((response) => response.json())
        .then(async (data) => {
          if (data.response.status) {
            if (type === "hidden") update(index, updated, "hidden");
            if (type === "ens") update(index, updated, "ens");
            setMessage("Meta Update Successful");
            setTimeout(() => {
              setLoading(false);
            }, 2000);
            handleSubmit;
          } else {
            console.error("ERROR:", "Failed to write meta to IPNS.eth backend");
            setTimeout(() => {
              setLoading(false);
            }, 2000);
            setLoading(false);
            handleSubmit;
            setMessage("Meta Update Failed");
            setCrash(true);
          }
        });
    } catch (error) {
      console.error("ERROR:", "Failed to write meta to IPNS.eth backend");
      setMessage("Meta Update Failed");
      setTimeout(() => {
        setLoading(false);
      }, 2000);
      handleSubmit;
      setCrash(true);
    }
  }

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, _Wallet_]);

  // Adjust to historical
  React.useEffect(() => {
    if (
      JSON.stringify(historical) !==
      JSON.stringify(constants.EMPTY_HISTORY_RECORDS)
    ) {
      const _update = async () => {
        for (let i = 0; i < inputValue.length; i++) {
          if (i < historical.data.ipns.length) {
            await update(i, "ipns://" + historical.data.ipns[i], "ipns");
            await update(i, "ipfs://" + historical.data.ipfs[i], "ipfs");
            await update(i, Number(historical.data.timestamp[i]), "timestamp");
            await update(i, historical.data.revision[i], "revision");
            await update(i, historical.data.name[i], "name");
            await update(
              i,
              historical.data.ens[i] === "0" ? "" : historical.data.ens[i],
              "ens"
            );
            await update(
              i,
              String(historical.data.hidden[i]) === "1" ? true : false,
              "hidden"
            );
            await update(i, Number(historical.data.sequence[i]), "sequence");
          }
          await update(i, false, "loading.ipns");
          await update(i, false, "loading.ipfs");
        }
        setLoading(false);
      };
      _update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historical]);

  // Trigger Name modal update
  React.useEffect(() => {
    if (nameModal === -1) {
      if (nameModalState.trigger && nameModalState.modalData) {
        const _update = async () => {
          await update(nameModal, nameModalState.modalData, "name");
          setNameModal(-1);
          setNameModalState(constants.modalTemplate);
        };
        _update();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameModalState, nameModal, progress]);

  // Trigger name update from Salt modal
  React.useEffect(() => {
    if (saltModal === -1) {
      if (saltModalState.trigger && saltModalState.modalData) {
        const _update = async () => {
          await update(
            progress,
            saltModalState.modalData.split(":")[0],
            "name"
          );
          setSaltModal(-1);
          setSaltModalState(constants.modalSaltTemplate);
        };
        _update();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saltModalState, saltModal, progress]);

  // Trigger ENS update from ENS modal
  React.useEffect(() => {
    if (ensModal === -1) {
      if (ensModalState.trigger && ensModalState.modalData) {
        const _update = async () => {
          setMessage("Updating IPNS Metadata");
          setLoading(true);
          await writeMeta(progress, "ens", ensModalState.modalData);
          setEnsModal(-1);
          setEnsModalState(constants.modalTemplate);
        };
        _update();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensModalState, ensModal, progress]);

  // Trigger IPNS key deletion
  React.useEffect(() => {
    if (deleteModal === -1) {
      if (deleteModalState.trigger && deleteModalState.modalData) {
        setMessage("Deleting IPNS Key");
        const _update = async () => {
          setLoading(true);
          await writeMeta(
            progress,
            "hidden",
            deleteModalState.modalData ? "1" : "0"
          );
          //await update(progress, deleteModalState.modalData, "hidden");
          setDeleteModal(-1);
          setDeleteModalState(constants.modalBoolTemplate);
        };
        _update();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteModalState, deleteModal, progress]);

  // Signature S_IPNS statement; S_IPNS(K_WALLET) [IPNS Keygen]
  // S_IPNS is not recovered on-chain; no need for buffer prepend and hashing of message required to sign
  function statementIPNSKey(origin: string, extradata: string) {
    let _toSign = `Requesting Signature To Generate IPNS Key\n\nOrigin: ${origin}\nKey Type: ed25519\nExtradata: ${extradata}\nSigned By: ${caip10}`;
    let _digest = _toSign;
    return _digest;
  }

  // Wagmi Signature hook
  const {
    data: signature,
    error: signError,
    isLoading: signLoading,
    signMessage,
  } = useSignMessage({
    onSuccess(data, variables) {
      const address = ethers.verifyMessage(variables.message, data);
      recoveredAddress.current = address;
    },
  });

  // Trigger Signer generation
  React.useEffect(() => {
    if (saltModalState.trigger) {
      setSigCount(1);
      const SIGN_SIGNER = async () => {
        signMessage({
          message: statementIPNSKey(
            saltModalState.modalData.split(":")[0],
            ethers.keccak256(
              ethers.solidityPacked(
                ["bytes32", "address"],
                [
                  ethers.keccak256(
                    ethers.solidityPacked(
                      ["string"],
                      [saltModalState.modalData.split(":")[1]]
                    )
                  ),
                  _Wallet_,
                ]
              )
            )
          ),
        });
      };
      SIGN_SIGNER();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saltModalState]);

  // Sets signature from Wagmi signMessage() as S_IPNS(K_WALLET)
  React.useEffect(() => {
    if (signature) {
      if (sigCount === 1 && !keypair[0]) {
        setMessage("Generating IPNS Key");
        const keygen = async () => {
          const _origin = saltModalState.modalData.split(":")[0];
          const __keypair = await KEYGEN(
            _origin,
            caip10,
            signature,
            saltModalState.modalData.split(":")[1]
          );
          update(progress, constants.formatkey(__keypair), "authority");
          setKeypair(__keypair);
          setMessage("IPNS Key Generated");
        };
        keygen();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, sigCount, keypair]);

  // Triggers IPNS CID derivation with new S_IPNS(K_WALLET)
  React.useEffect(() => {
    if (keypair[0] && signature) {
      const CIDGen = async () => {
        let key = constants.formatkey(keypair);
        let payload = secp256k1.utils.hexToBytes(key);
        const w3name = await Name.from(payload);
        const CID_IPNS = String(w3name);
        setCID(CID_IPNS);
      };
      CIDGen();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keypair, signature]);

  // Triggers CID write to record
  React.useEffect(() => {
    if (CID) {
      const _update = async () => {
        if (!inputValue[progress].ipns) {
          await update(progress, `ipns://${CID}`, "ipns");
        } else {
          if (inputValue[progress].ipns.split("ipns://")[1] === CID) {
            await update(progress, `ipns://${CID}`, "ipns");
          } else {
            if (skip !== progress) {
              console.error(
                "ERROR:",
                "Failed to write meta to IPNS.eth backend"
              );
              setMessage("Meta Update Failed");
              setTimeout(() => {
                setLoading(false);
              }, 2000);
              setCrash(true);
            } else {
              console.error("ERROR:", "Bad Password");
              setMessage("Seems Like Bad Password");
              setTimeout(() => {
                setLoading(false);
              }, 2000);
              setCrash(true);
              await update(progress, ``, "authority");
            }
          }
        }
        await update(progress, false, "loading.ipns");
        setLoading(false);
        doFinish();
      };
      _update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CID, progress, inputValue, skip]);

  // Sets signature status
  React.useEffect(() => {
    if (signLoading) {
      setLoading(true);
      setMessage(sigCount === 1 ? "Waiting for Keygen Signature" : "");
    }
    if (signError) {
      setMessage("Signature Failed");
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signLoading, signError, sigCount]);

  // Handles return to index.tsx
  const handleSubmit = (e: { preventDefault: () => void }) => {
    handleModalData(JSON.stringify(inputValue));
    handleTrigger(true);
    e.preventDefault();
  };
  // Handles making more room
  const handleExpand = (_inputValue: any) => {
    const nextInput = constants.makeMoreRoom(_inputValue);
    setInputValue(nextInput);
  };

  // Update values
  async function update(
    id: number,
    value: string | boolean | number,
    type: string
  ) {
    setInputValue((prevInputValue: any) => {
      const index = prevInputValue.findIndex((record: any) => record.id === id);
      if (index !== -1) {
        const updatedRecords = [...prevInputValue];
        if (type === "ipns") {
          updatedRecords[index] = { ...updatedRecords[index], ipns: value };
        } else if (type === "ipfs") {
          updatedRecords[index] = { ...updatedRecords[index], ipfs: value };
        } else if (type === "new") {
          updatedRecords[index] = { ...updatedRecords[index], new: value };
        } else if (type === "name") {
          updatedRecords[index] = { ...updatedRecords[index], name: value };
        } else if (type === "revision") {
          updatedRecords[index] = { ...updatedRecords[index], revision: value };
        } else if (type === "sequence") {
          updatedRecords[index] = { ...updatedRecords[index], sequence: value };
        } else if (type === "block") {
          updatedRecords[index] = { ...updatedRecords[index], block: value };
        } else if (type === "ens") {
          updatedRecords[index] = { ...updatedRecords[index], ens: value };
        } else if (type === "hidden") {
          updatedRecords[index] = { ...updatedRecords[index], hidden: value };
        } else if (type === "authority") {
          updatedRecords[index] = {
            ...updatedRecords[index],
            authority: value,
          };
        } else if (type === "timestamp") {
          updatedRecords[index] = {
            ...updatedRecords[index],
            timestamp: value,
          };
        } else if (type === "loading.ipns") {
          updatedRecords[index] = {
            ...updatedRecords[index],
            loading: { ...updatedRecords[index].loading, ipns: value },
          };
        } else if (type === "loading.ipfs") {
          updatedRecords[index] = {
            ...updatedRecords[index],
            loading: { ...updatedRecords[index].loading, ipfs: value },
          };
        }
        return updatedRecords;
      }
      return prevInputValue;
    });
  }

  return (
    <div className="flex-column">
      <div>
        <button
          className="button flex-row emphasis"
          style={{
            alignSelf: "flex-end",
            height: "25px",
            width: "auto",
            marginBottom: "6px",
            marginTop: "-31px",
          }}
          disabled={constants.countVal(inputValue) < 2}
          hidden={constants.countVal(inputValue) < 2}
          onClick={handleSubmit}
          data-tooltip={"Write Record"}
        >
          <div>{"Edit All"}</div>
          <div
            className="material-icons-round smol"
            style={{
              color: "white",
            }}
          >
            edit
          </div>
        </button>
      </div>
      <div className={!mobile ? styles.grid : "flex-column"}>
        {loading && (
          <div className="flex-column">
            <div
              style={{
                padding: "100px 200px",
                margin: "-240px 0 0 100%",
                background: "black",
                height: "200%",
                width: "200%",
              }}
            >
              <Loading height={50} width={50} />
            </div>
            <div
              style={{
                marginTop: sigCount > 0 ? "-65px" : "-40px",
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
            <div
              style={{
                marginTop: "20px",
                paddingBottom: "30px",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: "24px",
                  fontWeight: "700",
                  fontFamily: "SF Mono",
                }}
              >
                {sigCount > 0 ? `${sigCount}/1` : ""}
              </span>
            </div>
          </div>
        )}
        {!loading &&
          inputValue.map((record: any, index: number) => (
            <div
              key={index}
              className={!mobile ? styles.arrange : "flex-column"}
              style={{
                marginTop: !mobile ? "0" : "10px",
              }}
              hidden={record.hidden || record.revision === "0x0"}
            >
              <div className="flex-sans-align">
                <div
                  className="flex-row-sans-justify"
                  style={{
                    justifyContent: "space-between",
                  }}
                >
                  <div className="flex-row-sans-justify">
                    {/* Name */}
                    <div
                      onClick={() =>
                        !record.ipns && record.ipns // [!!!]
                          ? (setNameModal(record.id), setTrigger(record.id))
                          : update(record.id, true, "block")
                      }
                      style={{
                        cursor: "text",
                      }}
                    >
                      <h4
                        style={{
                          fontFamily: "SF Mono",
                          fontSize: "20px",
                          color: "cyan",
                          marginBottom: "26.25px",
                        }}
                      >
                        {record.name}
                      </h4>
                    </div>
                    {/* Export/Import Key */}
                    <button
                      className="button-tiny"
                      data-tooltip={record.ipns ? "Export Key" : "Import Key"}
                      onClick={() => {
                        record.ipns
                          ? (setHelp("Export Feature Coming Soon"), setHelpModal(true))
                          : (setHelp("Import Feature Coming Soon"), setHelpModal(true));
                      }}
                    >
                      <div
                        style={{
                          marginLeft: "5px",
                        }}
                      >
                        <div
                          className="material-icons-round smol"
                          style={{
                            color: !record.ipns ? "grey" : "grey",
                            fontSize: "18px",
                          }}
                        >
                          {record.ipns ? "vpn_key" : "key"}
                        </div>
                      </div>
                    </button>
                    {/* Gateway */}
                    <button
                      className="button-tiny"
                      data-tooltip={record.ipns ? "Visit Gateway" : ""}
                      onClick={() => {
                        record.ipns
                          ? window.open(
                              `https://${
                                record.ipns
                                  ? record.ipns.split("ipns://")[1]
                                  : "0"
                              }.ipfs2.eth.limo`,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          : "";
                      }}
                      disabled={!record.ipns}
                    >
                      <div
                        style={{
                          marginLeft: "5px",
                        }}
                      >
                        <div
                          className="material-icons-round smol"
                          style={{
                            color: !record.ipns ? "grey" : "lime",
                            fontSize: "18px",
                          }}
                        >
                          {record.ipns ? "rss_feed" : "rss_feed"}
                        </div>
                      </div>
                    </button>
                    {/* Active */}
                    <button
                      className="button-tiny"
                      data-tooltip={
                        longQueue[record.id] < 0
                          ? "In Waiting Period"
                          : "Ready For Update"
                      }
                      onClick={() => {
                        longQueue[record.id] < 0
                          ? setHelp(
                              "Record updates must be separated by half hour. Please wait <span></span>"
                            )
                          : setHelp("Ready For Next Update");
                        setHelpModal(true);
                      }}
                    >
                      <div
                        style={{
                          marginLeft: "3px",
                        }}
                      >
                        <div
                          className="material-icons-round smol"
                          style={{
                            color:
                              longQueue[record.id] < 0 ? "orangered" : "lime",
                            fontSize: "18px",
                          }}
                        >
                          {longQueue[record.id] < 0 ? "alarm" : "alarm"}
                        </div>
                      </div>
                    </button>
                    {/* ENS */}
                    <button
                      className="button-tiny"
                      disabled={!record.ipns}
                      data-tooltip={"Linked ENS"}
                      onClick={() => {
                        setEnsModal(record.id);
                        setTrigger(record.id);
                        setSigCount(0);
                      }}
                    >
                      <div
                        style={{
                          margin: "0 -5px -1px 10px",
                        }}
                      >
                        <img alt="ens" src="ens.png" width="15px" />
                      </div>
                    </button>
                    {/* Delete */}
                    <button
                      className="button-tiny"
                      disabled={!record.ipns}
                      data-tooltip={"Delete IPNS Key"}
                      onClick={() => {
                        setDeleteModal(record.id);
                        setTrigger(record.id);
                        setSigCount(0);
                      }}
                    >
                      <div
                        style={{
                          marginLeft: "10px",
                        }}
                      >
                        <div
                          className="material-icons-round smol"
                          style={{
                            color: "orangered",
                            fontSize: "18px",
                          }}
                        >
                          {"delete"}
                        </div>
                      </div>
                    </button>
                    {/* Value verify badge */}
                    <button
                      className="button-tiny"
                      hidden={
                        record.new &&
                        constants.isGoodValue("contenthash", record.new)
                          ? false
                          : !record.ipfs
                          ? false
                          : true
                      }
                      data-tooltip={
                        record.new &&
                        constants.isGoodValue("contenthash", record.new)
                          ? "Legit Value"
                          : !record.ipfs
                          ? ""
                          : "Bad Value"
                      }
                      style={{
                        margin: "0 0 -1px 4px",
                      }}
                    >
                      <div
                        className="material-icons-round smol"
                        style={{
                          color:
                            record.ipfs &&
                            constants.isGoodValue("contenthash", record.new)
                              ? "lime"
                              : !record.ipfs
                              ? "transparent"
                              : "orangered",
                        }}
                      >
                        {record.ipfs &&
                        constants.isGoodValue("contenthash", record.new)
                          ? "check_circle_outline"
                          : "info_outline"}
                      </div>
                    </button>
                  </div>
                  {/* Edit button */}
                  <div>
                    <button
                      className="button flex-row"
                      style={{
                        alignSelf: "flex-end",
                        height: "25px",
                        width: "auto",
                        marginBottom: "6px",
                      }}
                      disabled={
                        !constants.isGoodValue("contenthash", record.new)
                      }
                      hidden={
                        !constants.isGoodValue("contenthash", record.new) ||
                        constants.countVal(inputValue) > 1 ||
                        !record.authority
                      }
                      onClick={handleSubmit}
                      data-tooltip={"Write Record"}
                    >
                      <div>{"Edit"}</div>
                      <div
                        className="material-icons-round smol"
                        style={{
                          color: "white",
                        }}
                      >
                        edit
                      </div>
                    </button>
                  </div>
                </div>
                <div
                  className="flex-row"
                  style={{
                    marginTop: "-20px",
                  }}
                >
                  <div className="flex-column">
                    {/* IPNS Bar */}
                    <div className="flex-row">
                      <input
                        id={`${record.id}-ipns`}
                        key="0"
                        placeholder={record.ipns || "generate IPNS key"}
                        contentEditable={false}
                        type="text"
                        value={record.ipns}
                        onChange={(e) => {
                          update(record.id, e.target.value, "ipns");
                          update(record.id, true, "block");
                        }}
                        disabled={true}
                        style={{
                          background: "#361a17",
                          outline: "none",
                          border: "none",
                          padding: record.ipns
                            ? "5px 30px 5px 5px"
                            : "9.5px 30px 9.5px 5px",
                          borderRadius: "3px",
                          fontFamily: record.ipns ? "SF Mono" : "Spotnik",
                          letterSpacing: "-0.5px",
                          fontWeight: record.ipns ? "400" : "700",
                          fontSize: record.ipns ? "14px" : "12px",
                          width: "400px",
                          wordWrap: "break-word",
                          textAlign: record.ipns ? "left" : "right",
                          color: constants.isGoodValue(
                            "contenthash",
                            record.ipns
                          )
                            ? "lightgreen"
                            : "orange",
                          cursor: record.block ? "not-allowed" : "default",
                        }}
                      />
                      <div
                        id={`${record.id}-ipns-copy`}
                        className={
                          record.ipns
                            ? "material-icons-round"
                            : record.loading.ipns
                            ? "material-icons-round"
                            : "material-icons-round pulse"
                        }
                        style={{
                          fontSize: "22px",
                          fontWeight: "700",
                          margin: "0 0 0 -25px",
                          color:
                            !record.loading.ipns && !record.ipns
                              ? "white"
                              : "lightgreen",
                          cursor: !record.loading.ipns
                            ? record.ipns
                              ? "copy"
                              : "pointer"
                            : "wait",
                          opacity:
                            nameModal >= 0 || saltModal >= 0 || ensModal >= 0
                              ? "0"
                              : "1",
                        }}
                        onClick={() => {
                          !record.loading.ipns
                            ? record.ipns
                              ? constants.copyToClipboard(
                                  `${record.ipns}`,
                                  `${record.id}-ipns-copy`,
                                  `${record.id}-ipns`
                                )
                              : (setSaltModal(record.id),
                                setTrigger(record.id),
                                setSkip(record.id))
                            : "";
                        }}
                      >
                        {!record.loading.ipns
                          ? record.ipns
                            ? "content_copy"
                            : "lock_open"
                          : "hourglass_top"}
                      </div>
                    </div>
                    {/* IPFS Bar */}
                    <div className="flex-row">
                      <input
                        id={`${record.id}-ipfs`}
                        key="1"
                        placeholder={
                          record.ipfs ||
                          (!record.ipns ? "IPFS hash" : "Enter IPFS Hash")
                        }
                        type="text"
                        value={record.new}
                        onChange={(e) => {
                          update(record.id, e.target.value, "new");
                        }}
                        disabled={
                          unauthorised() ||
                          !record.ipns ||
                          longQueue[record.id] < 0
                        }
                        style={{
                          background: "#082400",
                          outline: "none",
                          border: "none",
                          padding:
                            record.ipfs || record.new
                              ? "5px 30px 5px 5px"
                              : "9.5px 30px 9.5px 5px",
                          borderRadius: "3px",
                          fontFamily:
                            record.ipfs || record.new ? "SF Mono" : "Spotnik",
                          letterSpacing: "-0.5px",
                          fontWeight: record.ipfs || record.new ? "400" : "700",
                          fontSize: record.ipfs || record.new ? "14px" : "12px",
                          width: "400px",
                          wordWrap: "break-word",
                          textAlign:
                            record.ipfs || record.new
                              ? "left"
                              : !record.ipns
                              ? "right"
                              : "left",
                          color: constants.isGoodValue(
                            "contenthash",
                            record.new
                          )
                            ? "lightgreen"
                            : record.ipfs
                            ? "orange"
                            : "orangered",
                          cursor:
                            unauthorised() ||
                            !record.ipns ||
                            longQueue[record.id] < 0
                              ? "not-allowed"
                              : "text",
                        }}
                      />
                      <div
                        id={`${record.id}-ipfs-copy`}
                        className={
                          constants.isGoodValue("contenthash", record.new) &&
                          !record.authority
                            ? "material-icons-round pulse"
                            : "material-icons-round"
                        }
                        style={{
                          fontSize: "22px",
                          fontWeight: "700",
                          margin:
                            record.ipfs || record.new
                              ? "0 0 0 -25px"
                              : "0 0 0 -25px",
                          color: !record.loading.ipfs
                            ? record.ipfs
                              ? "lightgreen"
                              : record.new &&
                                constants.isGoodValue("contenthash", record.new)
                              ? "lightgreen"
                              : "white"
                            : "white",
                          cursor: !record.loading.ipfs
                            ? record.ipfs
                              ? "copy"
                              : "default"
                            : "wait",
                          opacity:
                            nameModal >= 0 || saltModal >= 0 || ensModal >= 0
                              ? "0"
                              : record.new
                              ? !constants.isGoodValue(
                                  "contenthash",
                                  record.new
                                )
                                ? "0"
                                : "1"
                              : record.ipfs
                              ? "1"
                              : "0.35",
                        }}
                        onClick={() =>
                          !record.new
                            ? constants.copyToClipboard(
                                `${record.ipfs || record.new}`,
                                `${record.id}-ipfs-copy`,
                                `${record.id}-ipfs`
                              )
                            : !constants.isGoodValue("contenthash", record.new)
                            ? ""
                            : (setSaltModal(record.id),
                              setTrigger(record.id),
                              setSkip(record.id))
                        }
                      >
                        {!record.loading.ipfs
                          ? constants.isGoodValue("contenthash", record.new) &&
                            record.authority
                            ? "lock"
                            : record.ipfs && !record.new
                            ? "content_copy"
                            : "lock_open"
                          : "hourglass_top"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="modal-2">
                {trigger === record.id && (
                  <>
                    <NameModal
                      onClose={() => {
                        setProgress(nameModal);
                        setNameModal(-1);
                      }}
                      show={nameModal >= 0}
                      history={inputValue.map((key) => key["name"])}
                      handleTrigger={handleNameTrigger}
                      handleModalData={handleNameModalData}
                    >
                      {nameModal >= 0
                        ? inputValue[nameModal].name
                        : record.name}
                    </NameModal>
                    <Salt
                      handleTrigger={handleSaltTrigger}
                      handleModalData={handleSaltModalData}
                      onClose={() => {
                        setProgress(saltModal);
                        setSaltModal(-1);
                      }}
                      show={saltModal >= 0}
                    >
                      {[
                        saltModal >= 0
                          ? inputValue[saltModal].name
                          : record.name,
                        saltModal,
                        inputValue.map((key) => key["name"]),
                      ]}
                    </Salt>
                    <EnsModal
                      onClose={() => {
                        setProgress(ensModal);
                        setEnsModal(-1);
                      }}
                      show={ensModal >= 0}
                      handleTrigger={handleEnsTrigger}
                      handleModalData={handleEnsModalData}
                    >
                      {record.ens}
                    </EnsModal>
                    <DeleteModal
                      onClose={() => {
                        setProgress(deleteModal);
                        setDeleteModal(-1);
                      }}
                      show={deleteModal >= 0}
                      handleTrigger={handleDeleteTrigger}
                      handleModalData={handleDeleteModalData}
                    >
                      {""}
                    </DeleteModal>
                    <ErrorModal
                      onClose={() => {
                        setCrash(false);
                      }}
                      color={"orangered"}
                      show={crash && !loading}
                      title={"cancel"}
                    >
                      {message}
                    </ErrorModal>
                  </>
                )}
              </div>
            </div>
          ))}
        <div id="modal">
          <Help
            color={"cyan"}
            icon={"info"}
            onClose={() => setHelpModal(false)}
            show={helpModal}
            position={""}
            handleModalData={function (data: string | undefined): void {
              throw new Error();
            }}
            handleTrigger={function (data: boolean): void {
              throw new Error();
            }}
          >
            {help}
          </Help>
        </div>
      </div>
      <div hidden={loading}>
        <button
          className="button flex-row"
          style={{
            alignSelf: "flex-end",
            height: "30px",
            width: "auto",
            marginBottom: "25px",
            marginTop: "25px",
            background: "#4efc0339",
          }}
          disabled={records.length === 50}
          hidden={records.length === 50}
          onClick={() => handleExpand([...inputValue])}
          data-tooltip={"Add More Keys"}
        >
          <div>{"Add More"}</div>
          <div
            className="material-icons-round smol"
            style={{
              color: "white",
            }}
          >
            add
          </div>
        </button>
      </div>
    </div>
  );
};

export default Records;
