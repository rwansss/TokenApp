import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { XrplClient } from '../services/XrplClient';

const Card = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
  backdrop-filter: blur(5px);
`;

const WalletInfo = styled.div`
  margin-bottom: 1rem;
  word-break: break-all;
  
  p {
    margin: 0.5rem 0;
    font-family: monospace;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button`
  &.danger {
    background: #ff4757;
    &:hover {
      background: #ff6b81;
    }
  }
`;

const FeeEstimate = styled.div`
  font-size: 0.9rem;
  color: #00ff9d;
  margin-top: 0.5rem;
  font-family: monospace;
`;

const ConfirmDialog = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ff4757;
  z-index: 100;
`;

export const WalletCard = ({ wallet, onBlackHole, onBurnLP }) => {
  const [feeEstimate, setFeeEstimate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null);

  useEffect(() => {
    // Fetch fee estimate when card mounts
    const getFeeEstimate = async () => {
      const client = await XrplClient.getClient();
      try {
        const fee = await client.getFee();
        setFeeEstimate(fee);
      } catch (error) {
        console.error('Fee estimation error:', error);
        setFeeEstimate('Unable to estimate');
      } finally {
        client.disconnect();
      }
    };
    getFeeEstimate();
  }, []);

  const handleAction = (action, type) => {
    setShowConfirm({
      type,
      onConfirm: () => {
        action();
        setShowConfirm(null);
      },
      onCancel: () => setShowConfirm(null)
    });
  };

  return (
    <Card>
      <WalletInfo>
        <p><strong>Address:</strong> {wallet.address}</p>
        <p><strong>Seed:</strong> {wallet.seed}</p>
        {feeEstimate && (
          <FeeEstimate>
            Estimated transaction fee: {feeEstimate} XRP
          </FeeEstimate>
        )}
      </WalletInfo>
      <ButtonGroup>
        <ActionButton 
          className="danger" 
          onClick={() => handleAction(onBlackHole, 'blackhole')}
        >
          Black Hole Wallet
        </ActionButton>
        <ActionButton 
          className="danger" 
          onClick={() => handleAction(onBurnLP, 'burn')}
        >
          Burn LP
        </ActionButton>
      </ButtonGroup>

      {showConfirm && (
        <ConfirmDialog>
          <p>Are you sure you want to {showConfirm.type === 'blackhole' ? 'black hole this wallet' : 'burn LP'}?</p>
          <p>This action cannot be undone!</p>
          <ButtonGroup>
            <ActionButton onClick={showConfirm.onConfirm}>Confirm</ActionButton>
            <ActionButton onClick={showConfirm.onCancel}>Cancel</ActionButton>
          </ButtonGroup>
        </ConfirmDialog>
      )}
    </Card>
  );
}; 