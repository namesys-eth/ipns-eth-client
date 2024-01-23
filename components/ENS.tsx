import React from "react";
import { isMobile } from "react-device-detect";
import ReactDOM from "react-dom";
import styled from "styled-components";
import Help from "./Help";
import * as constants from "../utils/constants";

interface ModalProps {
  show: boolean;
  onClose: any;
  children: string;
  handleModalData: (data: string) => void;
  handleTrigger: (data: boolean) => void;
}

const ENSModal: React.FC<ModalProps> = ({
  show,
  onClose,
  children,
  handleModalData,
  handleTrigger,
}) => {
  const [inputValue, setInputValue] = React.useState(children);
  const [browser, setBrowser] = React.useState(false);
  const [helpModal, setHelpModal] = React.useState(false);
  const [help, setHelp] = React.useState("");

  React.useEffect(() => {
    setBrowser(true);
    setInputValue(children);
  }, [children]);

  const handleCloseClick = (e: { preventDefault: () => void }) => {
    handleModalData("");
    handleTrigger(false);
    setInputValue(children);
    e.preventDefault();
    onClose();
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    handleModalData(inputValue);
    handleTrigger(true);
    e.preventDefault();
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
                marginTop: "10px",
                fontSize: "50px",
              }}
            >
              satellite_alt
            </div>
            <div
              style={{
                marginTop: "25px",
                marginBottom: "15px",
              }}
            >
              <span
                style={{
                  fontWeight: "700",
                  fontSize: "20px",
                }}
              >
                Set ENS
              </span>
              <button
                className="button-tiny button-blank"
                style={{
                  marginBottom: "-7.5px",
                }}
                onClick={() => {
                  setHelpModal(true),
                    setHelp(
                      '<span>Linked <span style="color: cyan">ENS</span> through <span style="color: cyan">Contenthash</span></span>'
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
          <input
            className="inputextra"
            id="keyid"
            key="0"
            placeholder={inputValue || "enter ENS domain"}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
            }}
            style={{
              background: "black",
              outline: "none",
              border: "none",
              padding: "5px",
              borderRadius: "3px",
              fontFamily: "SF Mono",
              letterSpacing: "-0.5px",
              fontWeight: "400",
              fontSize: "16px",
              width: "100%",
              wordWrap: "break-word",
              textAlign: "left",
              color: constants.isDomain(inputValue)
                ? "lightgreen"
                : "rgb(255, 255, 255, 1)",
              cursor: "text",
            }}
          />
          <button
            className="button"
            style={{
              height: "30px",
              width: "100px",
              marginTop: "23px",
              fontSize: "15px",
            }}
            onClick={handleSubmit}
            data-tooltip="Confirm"
            disabled={!constants.isDomain(inputValue)}
          >
            <div
              className="flex-row"
              style={{
                fontSize: "16px",
                fontWeight: "700",
              }}
            >
              {"Set"}&nbsp;
              <span className="material-icons smoller">
                local_laundry_service
              </span>
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
  margin-top: -15px;
`;

const StyledModalTitle = styled.div`
  margin-top: -15px;
  font-size: 14px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  font-weight: 700;
  margin-bottom: 15px;
  padding-left: 20px;
  padding-right: 20px;
  color: cyan;
`;

const StyledModalHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StyledModal = styled.div`
  background: rgba(66,46,40,1);
  background-size: 400% 400%;
  width: 400px;
  max-width: ${isMobile ? "90%" : "60%"};
  height: 250px;
  border-radius: 6px;
  overflow-y: initial !important
  display: flex;
  text-align: center;
  justify-content: center;
  padding: 3px;
`;

const StyledModalOverlay = styled.div`
  position: absolute;
  top: -60px;
  left: 0;
  width: 100%;
  height: 110%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 1);
`;

export default ENSModal;
