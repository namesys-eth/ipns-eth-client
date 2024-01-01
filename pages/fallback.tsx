import React from 'react';

const Fallback: React.FC = () => (
  <div>
    {/* Content */}
    <div className="flex-column"
      style={{ 
        marginTop: '20%'
      }}
    >
      <span 
        className="material-icons"
        style={{
          fontWeight: '700',
          fontSize: '75px',
          color: '#fc6603',
          marginBottom: '30px'
        }}
      >
        signal_wifi_connected_no_internet_4
      </span>
      <span 
        style={{
          fontWeight: '700',
          fontSize: '40px',
          color: '#fc6603'
        }}
      >
        Your device is offline
      </span>
    </div>
  </div>
);

export default Fallback;