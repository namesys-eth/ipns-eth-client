import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'

interface ModalProps {
  title: string
  show: boolean
  color: string
  onClose: any
  children: any
}

const Error: React.FC<ModalProps> = ({ show, onClose, color, title, children }) => {
  const [browser, setBrowser] = React.useState(false)

  React.useEffect(() => {
    setBrowser(true)
  }, [])

  const handleCloseClick = (e: { preventDefault: () => void; }) => {
    e.preventDefault()
    onClose()
  }

  const modalContent = show ? (
    <StyledModalOverlay>
      <StyledModal>
        <StyledModalHeader>
          <a href="#" onClick={handleCloseClick}>
            <span className="material-icons">cancel</span>
          </a>
        </StyledModalHeader>
        {title && <StyledModalTitle>
          <div
            className="flex-column"
          >
            <div className="material-icons miui-small">{title}</div>
          </div>
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
  padding-top: 20px;
  padding-left: 20px;
  padding-right: 20px;
  padding-bottom: 10px;
  display: flex;
  height: auto;
  justify-content: center;
  overflow-y: auto;
  font-size: 18px;
  color: white;
  font-weight: 700;
  text-align: center;
  align-items: center;
  line-height: 20px;
`

const StyledModalTitle = styled.div`
  font-size: 18px;
  display: flex;
  justify-content: center;
  font-weight: 700;
  color: white;
  margin-top: -20px;
`

const StyledModalHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  font-size: 20px;
`

const StyledModal = styled.div`
  position: fixed;
  background: red;
  width: 400px;
  height: auto;
  border-radius: 6px;
  padding: 15px;
  overflow-y: initial !important
  padding-bottom: 20px;
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

export default Error
