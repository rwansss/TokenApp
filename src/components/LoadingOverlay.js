import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { 
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to { 
    opacity: 1;
    backdrop-filter: blur(8px);
  }
`;

const spinnerRotate = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const spinnerDash = keyframes`
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
`;

const messageAnimation = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 17, 23, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease;
`;

const SpinnerSVG = styled.svg`
  width: 50px;
  height: 50px;
  animation: ${spinnerRotate} 2s linear infinite;
  margin-bottom: 2rem;
`;

const SpinnerCircle = styled.circle`
  fill: none;
  stroke: #00ff9d;
  stroke-width: 4;
  stroke-linecap: round;
  animation: ${spinnerDash} 1.5s ease-in-out infinite;
`;

const Message = styled.div`
  color: #ffffff;
  font-size: 1.2rem;
  text-align: center;
  max-width: 80%;
  line-height: 1.5;
  background: rgba(0, 255, 157, 0.1);
  padding: 1.5rem 2.5rem;
  border-radius: 12px;
  border: 1px solid rgba(0, 255, 157, 0.2);
  box-shadow: 0 8px 32px rgba(0, 255, 157, 0.1);
  animation: ${messageAnimation} 0.5s ease;
  backdrop-filter: blur(4px);
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 0.5px;

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 12px;
    border: 1px solid transparent;
    background: linear-gradient(45deg, #00ff9d, #00a3ff) border-box;
    -webkit-mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    opacity: 0.5;
  }
`;

export const LoadingOverlay = ({ isLoading, message }) => {
  if (!isLoading && !message) return null;

  return (
    <OverlayContainer>
      {isLoading && (
        <SpinnerSVG viewBox="0 0 50 50">
          <SpinnerCircle cx="25" cy="25" r="20" />
        </SpinnerSVG>
      )}
      {message && <Message>{message}</Message>}
    </OverlayContainer>
  );
}; 