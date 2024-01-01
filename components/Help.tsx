import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import { isMobile } from 'react-device-detect'
import { useWindowDimensions } from '../hooks/useWindowDimensions'

interface StyledModalProps {
  top: string;
}

interface ModalProps {
  icon: string
  color: string
  show: boolean
  position: string
  onClose: any
  children: any
  handleModalData: (data: string | undefined) => void
  handleTrigger: (data: boolean) => void
}

const Help: React.FC<ModalProps> = ({ icon, color, show, onClose, children, position }) => {
  const [browser, setBrowser] = React.useState(false)
  const { width, height } = useWindowDimensions()
  const [mobile, setMobile] = React.useState(false)
  React.useEffect(() => {
    setBrowser(true)
  }, [])

  // INIT
  React.useEffect(() => {
    if (isMobile || (width && width < 1300)) {
      setMobile(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height])

  const handleCloseClick = (e: { preventDefault: () => void; }) => {
    e.preventDefault()
    onClose()
  }

  const modalContent = show ? (
    <StyledModalOverlay>
      <StyledModal top={position}>
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
              className="material-icons"
              style={{
                marginTop: '4px',
                fontSize: '36px',
                color: color
              }}
            >
              {icon}
            </span>
          </StyledModalTitle>}
        <StyledModalBody dangerouslySetInnerHTML={{ __html: children }} />
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
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 15px;
  display: flex;
  justify-content: center;
  height: auto;
  overflow-y: auto;
  color: white;
  font-size: 14px;
  font-weight: 700;
  line-height: 20px;
  max-width: 400px;
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

const StyledModal = styled.div<StyledModalProps>`
  position: fixed;
  top: ${(props: { top: any; }) => props.top}; 
  background: rgba(66,46,40,1);
  background-size: 400% 400%;
  width: auto;
  max-width: ${isMobile ? '90%' : '60%'};
  border-radius: 6px;
  overflow-y: initial !important
  display: flex;
  padding: 5px;
  justify-content: center;
  text-align: center;
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

export default Help
