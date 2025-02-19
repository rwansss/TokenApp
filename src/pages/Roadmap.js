import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Link } from 'react-router-dom';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;700&display=swap');
  @import url('https://api.fontshare.com/v2/css?f[]=satoshi@700&display=swap');
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    margin: 0;
    padding: 0;
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: 'Rajdhani', sans-serif;
    background: #0a0d14;
    color: #ffffff;
    line-height: 1.6;
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
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

const RoadmapContainer = styled.div`
  min-height: 100vh;
  background: #0a0d14;
  color: #ffffff;
  padding: 4rem 2rem;
  position: relative;
  overflow: hidden;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 6rem;
  
  h1 {
    font-family: 'Satoshi', sans-serif;
    font-size: 4rem;
    color: #00ff9d;
    text-transform: uppercase;
    letter-spacing: 4px;
  }
`;

const Timeline = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #00ff9d;
    transform: translateX(-50%);
  }
`;

const Phase = styled.div`
  display: flex;
  justify-content: ${props => props.right ? 'flex-end' : 'flex-start'};
  margin-bottom: 8rem;
  position: relative;
  width: 100%;
  
  &::before {
    content: '';
    position: absolute;
    left: ${props => props.right ? 'auto' : '50%'};
    right: ${props => props.right ? '50%' : 'auto'};
    top: 0;
    width: 16px;
    height: 16px;
    background: #00ff9d;
    border-radius: 50%;
    transform: translateX(${props => props.right ? '50%' : '-50%'});
    box-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
    z-index: 2;
  }
`;

const PhaseContent = styled.div`
  width: 45%;
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 12px;
  padding: 2rem;
  position: relative;
`;

const PhaseTitle = styled.h2`
  color: #00ff9d;
  font-size: 1.8rem;
  margin-bottom: 1.5rem;
  font-family: 'Satoshi', sans-serif;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    color: #8b949e;
    margin-bottom: 0.8rem;
    padding-left: 1.5rem;
    position: relative;

    &::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #00ff9d;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FeatureButton = styled.button`
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid #00ff9d;
  color: #00ff9d;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 157, 0.2);
    transform: translateY(-2px);
  }
`;

const BackgroundGraph = styled.div`
  position: absolute;
  top: 50%;
  right: 10%;
  transform: translateY(-50%);
  width: 200px;
  height: 200px;
  
  &::before {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-top: 2px solid #ff0000;
    border-right: 2px solid #ff0000;
    transform: rotate(45deg);
  }
`;

const BackButton = styled(Link)`
  position: fixed;
  top: 2rem;
  left: 2rem;
  padding: 0.8rem 1.5rem;
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 8px;
  color: #00ff9d;
  text-decoration: none;
  font-family: 'Satoshi', sans-serif;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 157, 0.2);
    transform: translateY(-2px);
  }
`;

// Add Modal components
const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(10, 13, 20, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: #161b22;
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  position: relative;
  border: 1px solid rgba(0, 255, 157, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  color: #8b949e;
  font-size: 1.5rem;
  cursor: pointer;
  
  &:hover {
    color: #00ff9d;
  }
`;

const ModalTitle = styled.h3`
  color: #00ff9d;
  margin-bottom: 1rem;
  font-size: 1.5rem;
`;

const ModalText = styled.p`
  color: #8b949e;
  line-height: 1.6;
`;

function Roadmap() {
  const [modalContent, setModalContent] = useState(null);

  const modalContents = {
    'Token Creator': {
      title: 'Token Creator Platform',
      content: 'Create your own token on XRPL with just a few clicks. Our platform provides an intuitive interface for token creation, customization, and deployment.'
    },
    'Launch Features': {
      title: 'Launch Features',
      content: 'Initial features include token creation, liquidity management, and automated market making capabilities.'
    },
    'Auto Sniper': {
      title: 'Auto Sniper Tool',
      content: 'Advanced trading tool that automatically detects and executes trades based on predefined criteria and market conditions.'
    },
    'Trading Guides': {
      title: 'Trading Guides',
      content: 'Comprehensive guides and tutorials for both beginners and advanced traders.'
    },
    'Copy Trading': {
      title: 'Copy Trading Platform',
      content: 'Follow and automatically replicate the trades of successful traders on the platform.'
    },
    'Analytics Suite': {
      title: 'Analytics Suite',
      content: 'Advanced analytics tools for tracking performance, market analysis, and portfolio management.'
    },
    'Web Apps': {
      title: 'Web Applications',
      content: 'Suite of web-based tools for trading, portfolio management, and market analysis.'
    },
    'Trading Bots': {
      title: 'Trading Bots',
      content: 'Automated trading bots with customizable strategies and risk management.'
    }
  };

  const handleButtonClick = (feature) => {
    setModalContent(modalContents[feature]);
  };

  return (
    <>
      <GlobalStyle />
      <RoadmapContainer>
        <BackButton to="/">← Back to Home</BackButton>
        <Header>
          <h1>LAUNCHX ROADMAP</h1>
        </Header>
        
        <BackgroundGraph />
        
        <Timeline>
          <Phase>
            <PhaseContent>
              <PhaseTitle>Phase 1: Launch of LAUNCHX $LAX</PhaseTitle>
              <FeatureList>
                <li>Initial token launch on XRPL</li>
                <li>Token Creator Platform Release</li>
                <li>Website and Documentation</li>
                <li>Marketing Campaigns</li>
                <li>Partnership Announcements</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton onClick={() => handleButtonClick('Token Creator')}>
                  Token Creator
                </FeatureButton>
                <FeatureButton onClick={() => handleButtonClick('Launch Features')}>
                  Launch Features
                </FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase right>
            <PhaseContent>
              <PhaseTitle>Phase 2: Auto Sniper Release</PhaseTitle>
              <FeatureList>
                <li>Auto Sniper Tool Launch</li>
                <li>YouTube Channel Creation</li>
                <li>Comprehensive Guide Videos</li>
                <li>Enhanced Trading Features</li>
                <li>Community Rewards Program</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton onClick={() => handleButtonClick('Auto Sniper')}>
                  Auto Sniper
                </FeatureButton>
                <FeatureButton onClick={() => handleButtonClick('Trading Guides')}>
                  Trading Guides
                </FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase>
            <PhaseContent>
              <PhaseTitle>Phase 3: Copy Trader Platform</PhaseTitle>
              <FeatureList>
                <li>Copy Trader Platform Release</li>
                <li>Advanced Trading Analytics</li>
                <li>Portfolio Management Tools</li>
                <li>Performance Tracking</li>
                <li>Social Trading Features</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton onClick={() => handleButtonClick('Copy Trading')}>
                  Copy Trading
                </FeatureButton>
                <FeatureButton onClick={() => handleButtonClick('Analytics Suite')}>
                  Analytics Suite
                </FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase right>
            <PhaseContent>
              <PhaseTitle>Phase 4: Web Apps & Expansion</PhaseTitle>
              <FeatureList>
                <li>Advanced Web Applications</li>
                <li>Mobile App Development</li>
                <li>Cross-chain Integration</li>
                <li>Advanced Trading Bots</li>
                <li>Institutional Tools</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton onClick={() => handleButtonClick('Web Apps')}>
                  Web Apps
                </FeatureButton>
                <FeatureButton onClick={() => handleButtonClick('Trading Bots')}>
                  Trading Bots
                </FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>
        </Timeline>

        {modalContent && (
          <Modal onClick={() => setModalContent(null)}>
            <ModalContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={() => setModalContent(null)}>×</CloseButton>
              <ModalTitle>{modalContent.title}</ModalTitle>
              <ModalText>{modalContent.content}</ModalText>
            </ModalContent>
          </Modal>
        )}
      </RoadmapContainer>
    </>
  );
}

export default Roadmap; 
