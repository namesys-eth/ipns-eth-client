import React from "react";
import styles from "../pages/page.module.css";
import { isMobile } from "react-device-detect";
import { useWindowDimensions } from "../hooks/useWindowDimensions";
import * as constants from "../utils/constants";
import { ethers } from "ethers";
import Help from "../components/Help";
import Salt from "../components/Salt";
import Loading from "../components/LoadingColors";
import NameModal from "../components/Name";
import { KEYGEN } from "../utils/keygen";
import Web3 from "web3";
import * as secp256k1 from "@noble/secp256k1";
import * as Name from "w3name";

import { useAccount, useSignMessage } from "wagmi";

interface RecordsContainerProps {
  meta: any;
  records: any[];
  hue: string;
  longQueue: number[];
  historical: typeof constants.EMPTY_HISTORY_RECORDS;
  handleModalData: (data: string) => void;
  handleTrigger: (data: boolean) => void;
}

const Records: React.FC<RecordsContainerProps> = ({
  meta,
  records,
  hue,
  longQueue,
  historical,
  handleModalData,
  handleTrigger,
}) => {
  const { address: _Wallet_ } = useAccount();
  const [helpModal, setHelpModal] = React.useState(false); // Help modal
  const [help, setHelp] = React.useState(""); // Set help
  const [progress, setProgress] = React.useState(-1); // Sets index of record in process
  const [message, setMessage] = React.useState("Loading"); // Set message to display
  const [loading, setLoading] = React.useState(false); // Loading Records marker
  const [editName, setEditName] = React.useState(-1); // Edit name of IPNS key
  const [saltModal, setSaltModal] = React.useState(-1); // Salt (password/key-identifier)
  const [sigCount, setSigCount] = React.useState(0); // Set signature count
  const [CID, setCID] = React.useState(""); // IPNS pubkey/CID value
  const [inputValue, setInputValue] = React.useState(records); // Input state
  const [mobile, setMobile] = React.useState(false); // Mobioe device
  const [queue, setQueue] = React.useState<number[]>(longQueue); // Sets queue countdown between successive updates
  const [nameModal, setNameModal] = React.useState(false); // Edit name modal
  const [keypair, setKeypair] = React.useState<[string, string]>(["", ""]); // Sets generated K_IPNS keys
  const [history, setHistory] = React.useState(historical); // Record history from last update
  const [nameModalState, setNameModalState] =
    React.useState<constants.MainBodyState>(constants.modalTemplate);
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
  const PORT = process.env.NEXT_PUBLIC_PORT;
  const SERVER = process.env.NEXT_PUBLIC_SERVER;

  // Handle Name modal data return
  const handleNameModalData = (data: string) => {
    setNameModalState((prevState) => ({ ...prevState, modalData: data }));
  };
  // Handle Name modal trigger
  const handleNameTrigger = (trigger: boolean) => {
    setNameModalState((prevState) => ({ ...prevState, trigger: trigger }));
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
      ? inputValue[inputValue.findIndex((_record) => _record.id === id)].ipns
      : type === "ipfs"
      ? inputValue[inputValue.findIndex((_record) => _record.id === id)].new
      : inputValue[inputValue.findIndex((_record) => _record.id === id)].name;
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

  // Whether connector can manage
  function canManage() {
    return (
      !_Wallet_ ||
      (!meta.wrapped && _Wallet_ !== meta.owner) ||
      (meta.wrapped && _Wallet_ !== meta.manager)
    );
  }

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height, _Wallet_]);

  // Adjust to history
  React.useEffect(() => {
    if (
      JSON.stringify(history) !==
      JSON.stringify(constants.EMPTY_HISTORY_RECORDS)
    ) {
      const _update = async () => {
        for (let i = 0; i < inputValue.length; i++) {
          if (i < history.data.ipns.length) {
            await update(i, "ipns://" + history.data.ipns[i], "ipns");
            await update(i, "ipfs://" + history.data.ipfs[i], "ipfs");
            await update(i, Number(history.data.timestamp[i]), "timestamp");
            await update(i, history.data.revision[i], "revision");
            await update(i, history.data.name[i], "name");
            await update(i, Number(history.data.sequence[i]), "sequence");
          }
          await update(i, false, "loading.ipns");
          await update(i, false, "loading.ipfs");
        }
        setLoading(false);
      };
      _update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history]);

  // Edit names of keys
  React.useEffect(() => {
    if (editName !== -1) setNameModal(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editName]);

  // Trigger Name modal update
  React.useEffect(() => {
    if (editName !== -1) {
      if (nameModalState.trigger && nameModalState.modalData) {
        const _update = async () => {
          await update(editName, nameModalState.modalData, "name");
          setEditName(-1);
        };
        _update();
      } else {
        setNameModalState(constants.modalTemplate);
      }
    } else {
      setNameModalState(constants.modalTemplate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameModalState, editName]);

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
        await update(progress, `ipns://${CID}`, "ipns");
        await update(progress, false, "loading.ipns");
        setLoading(false);
        doFinish();
      };
      _update();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CID, progress]);

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

  const handleSubmit = (e: { preventDefault: () => void }) => {
    handleModalData(JSON.stringify(inputValue));
    handleTrigger(true);
    e.preventDefault();
  };

  // Update values
  async function update(
    id: number,
    value: string | boolean | number,
    type: string
  ) {
    setInputValue((prevInputValue) => {
      const index = prevInputValue.findIndex((record) => record.id === id);
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
                margin: "-250px 0 0 100%",
                background: "black",
                height: "200%",
                width: "200%",
              }}
            >
              <Loading height={50} width={50} />
            </div>
            <div
              style={{
                marginTop: "-20px",
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
          inputValue.map((record, index) => (
            <div
              key={index}
              className={!mobile ? styles.arrange : "flex-column"}
              style={{
                marginTop: !mobile ? "0" : "10px",
              }}
            >
              <div className="flex-sans-align">
                <div
                  className="flex-row-sans-justify"
                  style={{
                    justifyContent: "space-between",
                  }}
                >
                  <div className="flex-row-sans-justify">
                    <div
                      onClick={() =>
                        !record.ipns
                          ? setEditName(record.id)
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
                    <button
                      className="button-tiny"
                      onClick={() => {}}
                      data-tooltip={
                        getVal(record.id, "ipfs") &&
                        constants.isGoodValue(
                          "contenthash",
                          getVal(record.id, "ipfs")
                        )
                          ? "Legit Value"
                          : !getVal(record.id, "ipfs")
                          ? ""
                          : "Bad Value"
                      }
                    >
                      <div
                        className="material-icons-round smol"
                        style={{
                          color:
                            getVal(record.id, "ipfs") &&
                            constants.isGoodValue(
                              "contenthash",
                              getVal(record.id, "ipfs")
                            )
                              ? "yellowgreen"
                              : !getVal(record.id, "ipfs")
                              ? "transparent"
                              : "orangered",
                          marginLeft: "5px",
                        }}
                      >
                        {getVal(record.id, "ipfs") &&
                        constants.isGoodValue(
                          "contenthash",
                          getVal(record.id, "ipfs")
                        )
                          ? "check_circle_outline"
                          : "info_outline"}
                      </div>
                    </button>
                  </div>
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
                        !constants.isGoodValue(
                          "contenthash",
                          getVal(record.id, "ipfs")
                        )
                      }
                      hidden={
                        !constants.isGoodValue(
                          "contenthash",
                          getVal(record.id, "ipfs")
                        ) || constants.countVal(inputValue) > 1
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
                        value={
                          canManage() ? getVal(record.id, "ipns") : record.ipns
                        }
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
                          color:
                            !record.ipns &&
                            constants.isGoodValue(
                              "contenthash",
                              getVal(record.id, "ipns")
                            )
                              ? "lightgreen"
                              : hue,
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
                          opacity: nameModal ? "0" : "1",
                        }}
                        onClick={() => {
                          !record.loading.ipns
                            ? record.ipns
                              ? constants.copyToClipboard(
                                  `${record.ipns}`,
                                  `${record.id}-ipns-copy`,
                                  `${record.id}-ipns`
                                )
                              : setSaltModal(record.id)
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
                        value={
                          canManage() ? getVal(record.id, "ipfs") : record.ipfs
                        }
                        onChange={(e) => {
                          update(record.id, e.target.value, "new");
                        }}
                        disabled={unauthorised() || !record.ipns}
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
                          color:
                            !record.ipfs &&
                            constants.isGoodValue(
                              "contenthash",
                              getVal(record.id, "ipfs")
                            )
                              ? "lightgreen"
                              : hue,
                          cursor:
                            unauthorised() || !record.ipns
                              ? "not-allowed"
                              : "text",
                        }}
                      />
                      <div
                        id={`${record.id}-ipfs-copy`}
                        className="material-icons-round"
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
                              : "white"
                            : "white",
                          cursor: !record.loading.ipfs
                            ? record.ipfs
                              ? "copy"
                              : "default"
                            : "wait",
                          opacity: nameModal
                            ? "0"
                            : !record.ipfs && !record.new
                            ? record.ipns
                              ? "1"
                              : "0.35"
                            : "1",
                        }}
                        onClick={() =>
                          record.ipfs
                            ? constants.copyToClipboard(
                                `${record.ipfs || record.new}`,
                                `${record.id}-ipfs-copy`,
                                `${record.id}-ipfs`
                              )
                            : ""
                        }
                      >
                        {!record.loading.ipfs
                          ? record.ipfs
                            ? "content_copy"
                            : record.new
                            ? "lock_open"
                            : record.ipns
                            ? "lock_open"
                            : "lock"
                          : "hourglass_top"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div id="modal-2">
                <NameModal
                  onClose={() => setNameModal(false)}
                  show={nameModal}
                  children={
                    editName !== -1 ? inputValue[editName].name : record.name
                  }
                  handleTrigger={handleNameTrigger}
                  handleModalData={handleNameModalData}
                />
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
                    saltModal >= 0 ? inputValue[saltModal].name : record.name,
                    saltModal,
                  ]}
                </Salt>
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
    </div>
  );
};

export default Records;
