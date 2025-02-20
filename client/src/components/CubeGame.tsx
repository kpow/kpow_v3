import React from 'react';

const CubeGame: React.FC = () => {
  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      position: 'relative',
      overflow: 'hidden'
    }}>
      <iframe
        src="/cube/index.html"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0
        }}
        title="The Cube Game"
      />
    </div>
  );
};

export default CubeGame;
