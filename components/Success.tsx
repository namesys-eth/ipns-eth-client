import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { isMobile } from 'react-device-detect'

interface ModalProps {
  icon: string
  color: string
  show: boolean
  onClose: any
  children: any
  handleModalData: (data: string | undefined) => void
  handleTrigger: (data: boolean) => void
}

const Success: React.FC<ModalProps> = ({ icon, color, show, onClose, children, handleModalData, handleTrigger }) => {
  const [browser, setBrowser] = React.useState(false)
  React.useEffect(() => {
    setBrowser(true)
  }, [])

  const handleCloseClick = (e: { preventDefault: () => void; }) => {
    handleModalData('0')
    handleTrigger(true)
    e.preventDefault()
    onClose()
  }

  const modalContent = show ? (
    <StyledModalOverlay>
      <StyledModal>
        <StyledModalHeader>
          <a href="#" onClick={handleCloseClick}>
            <span
              className="material-icons"
              style={{
                margin: '4px'
              }}
            >
              close
            </span>
          </a>
        </StyledModalHeader>
        {icon &&
          <StyledModalTitle>
            <span
              className="material-icons emphasis"
              style={{
                marginTop: '5px',
                marginBottom: '10px',
                fontSize: '68px',
                color: color
              }}
            >
              {icon}
            </span>
          </StyledModalTitle>}
        <StyledModalBody dangerouslySetInnerHTML={{ __html: children }} />
        <StyledModalBody>
          <div
            className="flex-row"
            style={{
              marginTop: '5px',
              marginBottom: '5px'
            }}
          >
            <button
              className="button"
              style={{
                height: '35px',
                width: '105px'
              }}
              onClick={handleCloseClick}
            >
              <div
                className="flex-row"
                style={{
                  fontSize: '15px',
                  fontWeight: '700'
                }}
              >
                {'Ok'}&nbsp;<span className="material-icons chonk">done_all</span>
              </div>
            </button>
          </div>
        </StyledModalBody>
      </StyledModal>
    </StyledModalOverlay>
  ) : null

  if (browser) {
    return ReactDOM.createPortal(
      modalContent,
      document.getElementById("modal")!
    )
  } else {
    return null
  }
}

const StyledModalBody = styled.div`
  padding-top: 0px;
  padding-left: ${isMobile ? '10px' : '20px'};
  padding-right: ${isMobile ? '10px' : '20px'};
  padding-bottom: 5px;
  margin-top: 0px;
  margin-left: ${isMobile ? '10px' : '20px'};
  margin-right: ${isMobile ? '10px' : '20px'};
  margin-bottom: ${isMobile ? '15px' : '20px'};
  display: flex;
  justify-content: center;
  height: auto;
  overflow-y: auto;
  color: white;
  font-size: 18px;
  font-weight: 700;
  line-height: 22px;
  max-width: ${isMobile ? '400px' : '400px'};
`

const StyledModalTitle = styled.div`
  margin-top: -15px;
  font-size: 20px;
  display: flex;
  justify-content: center;
  font-weight: 700;
  margin-bottom: 15px;
  color: white;
`

const StyledModalHeader = styled.div`
  display: flex;
  justify-content: flex-end;
`

const StyledModal = styled.div`
  position: fixed; 
  background: rgba(66,46,40,1);
  background-size: 400% 400%;
  width: auto;
  max-width: ${isMobile ? '90%' : '60%'};
  border-radius: 6px;
  overflow-y: initial !important
  display: flex;
  text-align: center;
  justify-content: center;
`

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
`

export default Success
