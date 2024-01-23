import React from "react";
import { isMobile } from "react-device-detect";
import ReactDOM from "react-dom";
import styled from "styled-components";
import Help from "./Help";
import { useWindowDimensions } from "../hooks/useWindowDimensions";

interface ModalProps {
  show: boolean;
  onClose: any;
  children: string[];
  handleModalData: (data: string) => void;
  handleTrigger: (data: boolean) => void;
}

const Salt: React.FC<ModalProps> = ({
  show,
  onClose,
  children,
  handleModalData,
  handleTrigger,
}) => {
  const [password, setPassword] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [browser, setBrowser] = React.useState(false);
  const [helpModal, setHelpModal] = React.useState(false);
  const [help, setHelp] = React.useState("");
  const { width, height } = useWindowDimensions();
  const [mobile, setMobile] = React.useState(false);
  React.useEffect(() => {
    setBrowser(true);
  }, []);

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  React.useEffect(() => {
    setBrowser(true);
    if (children[0] !== "...") setUsername(children[0]);
  }, [children]);

  const handleCloseClick = (e: { preventDefault: () => void }) => {
    handleModalData("");
    handleTrigger(false);
    setPassword("");
    setUsername("");
    e.preventDefault();
    onClose();
  };

  const handleSubmit = () => {
    handleModalData(`${username}:${password}`);
    handleTrigger(true);
    setPassword("");
    setUsername("");
    onClose();
  };

  const modalContent = show ? (
    <StyledModalOverlay>
      <StyledModal>
        <StyledModalHeader>
          <a href="#" onClick={handleCloseClick}>
            <span className="material-icons">close</span>
          </a>
        </StyledModalHeader>
        {show && (
          <StyledModalTitle>
            <div
              className="material-icons"
              style={{
                marginTop: "4px",
                fontSize: "66px",
                color: "lightgreen",
              }}
            >
              key
            </div>
            <div
              style={{
                marginTop: "5px",
              }}
            >
              <span
                style={{ fontSize: "16px", fontWeight: "700" }}
              >{`Enter Secret Key Identifier`}</span>
              <button
                className="button-tiny"
                style={{
                  marginTop: "-7.5px",
                }}
                onClick={() => {
                  setHelpModal(true);
                  setHelp(
                    '<span><span style="color: cyan">Secret identifier</span> or <span style="color: cyan">Password</span> is an <span style="color: orange">Optional Value</span> required to generate a secure <span style="color: cyan">IPNS key</span>.<br></br><span style="color: orange">You will need it to update your records in the future</span>. <span style="color: orangered">Please remember your choice</span>.</span>'
                  );
                }}
                data-tooltip={"Enlighten Me"}
              >
                <div
                  className="material-icons smol"
                  style={{
                    color: "cyan",
                    marginLeft: "5px",
                  }}
                >
                  info_outline
                </div>
              </button>
            </div>
          </StyledModalTitle>
        )}
        <StyledModalBody>
          <form
            className="flex-column"
            style={{
              marginLeft: "13px",
              marginTop: "7px",
            }}
          >
            <div
              className="flex-row"
              style={{
                width: "150%",
              }}
            >
              <input
                id={`username-${children[1]}`}
                key={`0-${children[1]}`}
                placeholder={username || "choose name for this key"}
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                }}
                style={{
                  background: "black",
                  outline: "none",
                  border: "none",
                  padding: "7px",
                  borderRadius: "3px",
                  fontFamily: "SF Mono",
                  letterSpacing: "-0.5px",
                  fontWeight: "400",
                  fontSize: "15px",
                  width: "150%",
                  wordWrap: "break-word",
                  textAlign: "left",
                  color:
                    username.length > 2 ? "lime" : "rgb(255, 255, 255, 0.6)",
                  cursor: "text",
                  marginBottom: "10px",
                }}
              />
              <button
                className="button-tiny"
                style={{
                  marginTop: "-12.5px",
                }}
                disabled
                onClick={() => {
                  setHelpModal(true);
                  setHelp(
                    '<span><span style="color: cyan">Username</span></span>'
                  );
                }}
                data-tooltip={"Username"}
              >
                <div
                  className="material-icons smol"
                  style={{
                    color: "cyan",
                    marginLeft: "5px",
                  }}
                >
                  info_outline
                </div>
              </button>
            </div>
            <div
              className="flex-row"
              style={{
                width: "150%",
              }}
            >
              <input
                id={`username-${children[1]}`}
                key={`1-${children[1]}`}
                placeholder="password (optional)"
                type="password"
                value={password}
                autoComplete="username current-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                style={{
                  background: "black",
                  outline: "none",
                  border: "none",
                  padding: "7px",
                  borderRadius: "3px",
                  fontFamily: "SF Mono",
                  letterSpacing: "-0.5px",
                  fontWeight: "400",
                  fontSize: "15px",
                  width: "150%",
                  wordWrap: "break-word",
                  textAlign: "left",
                  color: password ? "white" : "rgb(255, 255, 255, 0.6)",
                  cursor: "text",
                }}
              />
              <button
                className="button-tiny"
                style={{
                  marginTop: "0px",
                }}
                disabled
                onClick={() => {
                  setHelpModal(true);
                  setHelp(
                    '<span><span style="color: cyan">Secret IPNS identifier</span></span>'
                  );
                }}
                data-tooltip={"Password"}
              >
                <div
                  className="material-icons smol"
                  style={{
                    color: "cyan",
                    marginLeft: "5px",
                  }}
                >
                  info_outline
                </div>
              </button>
            </div>
          </form>
          <button
            className="button"
            style={{
              height: "33px",
              width: "130px",
              padding: "5px",
              marginTop: "20px",
              fontSize: "16px",
              fontWeight: "700",
            }}
            onClick={handleSubmit}
            disabled={username.length < 3 || username === "..."}
            data-tooltip="Click to proceed"
          >
            <div
              className="flex-row"
              style={{
                fontSize: "15px",
              }}
            >
              {"proceed"}&nbsp;
              <span className="material-icons smoller">vpn_key</span>
            </div>
          </button>
        </StyledModalBody>
      </StyledModal>
      <div id="modal-inner">
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
    </StyledModalOverlay>
  ) : null;

  if (browser) {
    return ReactDOM.createPortal(
      modalContent,
      document.getElementById("modal")!
    );
  } else {
    return null;
  }
};

const StyledModalBody = styled.div`
  padding-top: 5px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 25px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: auto;
  overflow-y: auto;
  color: white;
  font-size: 14px;
  font-weight: 700;
  margin-top: 5px;
`;

const StyledModalTitle = styled.div`
  margin-top: -15px;
  font-size: 14px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  font-weight: 700;
  color: white;
  padding-left: 20px;
  padding-right: 20px;
  color: cyan;
  margin-left: 10px;
`;

const StyledModalHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledModal = styled.div`
  position: fixed;
  background: rgba(66,46,40,1);
  background-size: 400% 400%;
  width: 460px;
  max-width: ${isMobile ? "90%" : "60%"};
  height: 285px;
  border-radius: 6px;
  overflow-y: initial !important
  display: flex;
  text-align: center;
  justify-content: center;
  padding: 3px;
`;

const StyledModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 1);
`;

export default Salt;
