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
  handleModalData: (data: boolean) => void;
  handleTrigger: (data: boolean) => void;
}

const DeleteModal: React.FC<ModalProps> = ({
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
    handleModalData(false);
    handleTrigger(false);
    setInputValue(children);
    e.preventDefault();
    onClose();
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    handleModalData(true);
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
              delete
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
                  fontSize: "22px",
                }}
              >
                Delete IPNS Key
              </span>
              <button
                className="button-tiny button-blank"
                style={{
                  marginBottom: "-7.5px",
                }}
                onClick={() => {
                  setHelpModal(true),
                    setHelp(
                      '<span><span style="color: orangered">Delete</span> IPNS Key</span>'
                    );
                }}
                data-tooltip={"Enlighten Me"}
              >
                <div
                  className="material-icons smol"
                  style={{
                    color: "orange",
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
          <div
            className="flex-row"
            style={{
              justifyContent: "space-between",
            }}
          >
            <button
              className="button"
              style={{
                height: "30px",
                width: "80px",
                marginTop: "23px 35px 0 5px",
                fontSize: "15px",
                color: "white",
                background: "red",
              }}
              onClick={handleSubmit}
              data-tooltip="Confirm"
            >
              <div
                className="flex-row"
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                {"Ok"}&nbsp;
                <span className="material-icons smoller">delete</span>
              </div>
            </button>
            <button
              className="button"
              style={{
                height: "30px",
                width: "120px",
                margin: "0 5px 0 15px",
                fontSize: "15px",
                color: "white",
                background: "grey",
              }}
              onClick={handleCloseClick}
              data-tooltip="Cancel"
            >
              <div
                className="flex-row"
                style={{
                  fontSize: "16px",
                  fontWeight: "700",
                }}
              >
                {"Cancel"}&nbsp;
                <span className="material-icons smoller">cancel</span>
              </div>
            </button>
          </div>
        </StyledModalBody>
      </StyledModal>
      <div id="modal-inner">
        <Help
          color={"orangered"}
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
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 5px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: auto;
  overflow-y: auto;
  color: orangered;
  font-size: 14px;
  font-weight: 700;
`;

const StyledModalTitle = styled.div`
  font-size: 16px;
  display: flex;
  justify-content: center;
  flex-direction: column;
  font-weight: 700;
  margin-bottom: 5px;
  color: orangered;
  padding-left: 20px;
  padding-right: 20px;
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

export default DeleteModal;
