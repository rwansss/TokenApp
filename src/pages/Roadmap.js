import React, { useState } from 'react';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
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
    font-family: 'Rajdhani', sans-serif;
    background: linear-gradient(135deg, #0a0d14 0%, #1a1f2c 100%);
    color: #ffffff;
    line-height: 1.6;
    overflow-x: hidden;
  }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const glowPulse = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 255, 157, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 157, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 255, 157, 0.2); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const RoadmapContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0d14 0%, #1a1f2c 100%);
  color: #ffffff;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  font-family: 'Rajdhani', sans-serif;
  margin: 0;
  width: 100%;

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

const Title = styled.h1`
  font-family: 'Satoshi', sans-serif;
  font-size: 4rem;
  text-align: center;
  margin: 2rem 0;
  background: linear-gradient(90deg, #00ff9d, #00a3ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-transform: uppercase;
  letter-spacing: 8px;
`;

const RoadmapTimeline = styled.div`
  max-width: 1200px;
  margin: 4rem auto;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, #00ff9d, #00a3ff);
  }
`;

const Phase = styled.div`
  display: flex;
  justify-content: ${props => props.position === 'right' ? 'flex-start' : 'flex-end'};
  width: 100%;
  position: relative;
  padding: 2rem 0;
`;

const PhaseContent = styled.div`
  width: 45%;
  padding: 2rem;
  background: #161b22;
  border-radius: 16px;
  position: relative;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 255, 157, 0.2);
  transition: all 0.3s ease;
  animation: ${float} 6s ease-in-out infinite;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 30px rgba(0, 255, 157, 0.2);
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    ${props => props.position === 'right' ? 'left: -15px;' : 'right: -15px;'}
    width: 15px;
    height: 15px;
    background: #00ff9d;
    border-radius: 50%;
    transform: translateY(-50%);
    animation: ${glowPulse} 2s infinite;
  }
`;

const PhaseTitle = styled.h3`
  color: #00ff9d;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  font-family: 'Satoshi', sans-serif;
  font-weight: 700;
`;

const PhaseDescription = styled.div`
  color: #8b949e;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.6;
  
  div {
    margin-bottom: 0.5rem;
  }
`;

const PreviewContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;

const PreviewButton = styled.button`
  padding: 0.8rem 1.5rem;
  background: rgba(0, 255, 157, 0.1);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 8px;
  color: #00ff9d;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Rajdhani', sans-serif;
  font-weight: 600;
  animation: ${float} 4s ease-in-out infinite;
  animation-delay: ${props => props.index * 0.2}s;

  &:hover {
    background: rgba(0, 255, 157, 0.2);
    transform: translateY(-2px);
    animation: ${glowPulse} 2s infinite;
  }
`;

const PreviewModal = styled.div`
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
  animation: ${fadeIn} 0.3s ease;
`;

const PreviewContent = styled.div`
  background: #161b22;
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 700px;
  width: 90%;
  position: relative;
  border: 1px solid rgba(0, 255, 157, 0.2);
  animation: ${fadeIn} 0.4s ease;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);

  h3 {
    color: #00ff9d;
    font-family: 'Satoshi', sans-serif;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
  }

  p {
    color: #8b949e;
    font-size: 1.1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  img {
    max-width: 100%;
    border-radius: 8px;
    margin-bottom: 1.5rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: #8b949e;
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #00ff9d;
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
  z-index: 100;

  &:hover {
    background: rgba(0, 255, 157, 0.2);
    transform: translateY(-2px);
  }
`;

const Roadmap = () => {
  const [previewContent, setPreviewContent] = useState(null);

  const handlePreview = (title, content) => {
    setPreviewContent({ title, content });
  };

  const closePreview = () => {
    setPreviewContent(null);
  };

  return (
    <>
      <GlobalStyle />
      <RoadmapContainer>
        <BackButton to="/">← Back to Home</BackButton>
        <Title>LAUNCHX ROADMAP</Title>
        <RoadmapTimeline>
          <Phase position="right">
            <PhaseContent position="right">
              <PhaseTitle>Phase 1: Launch of LAUNCHX $LAX</PhaseTitle>
              <PhaseDescription>
                <div>• Initial token launch on XRPL</div>
                <div>• Token Creator Platform Release</div>
                <div>• Website and Documentation</div>
                <div>• Marketing Campaigns</div>
                <div>• Partnership Announcements</div>
              </PhaseDescription>
              <PreviewContainer>
                <PreviewButton onClick={() => handlePreview("Token Creator", 
                  "Our revolutionary token creator platform makes it simple to launch your token on XRPL. With automated TOML generation and AMM integration, you can create and launch your token in minutes.")}>
                  Token Creator
                </PreviewButton>
                <PreviewButton onClick={() => handlePreview("Initial Features", 
                  "Launch features include automated market maker (AMM) integration, token burning capabilities, and a seamless token creation process with built-in security features.")}>
                  Launch Features
                </PreviewButton>
              </PreviewContainer>
            </PhaseContent>
          </Phase>

          <Phase position="left">
            <PhaseContent position="left">
              <PhaseTitle>Phase 2: Auto Sniper Release</PhaseTitle>
              <PhaseDescription>
                <div>• Auto Sniper Tool Launch</div>
                <div>• YouTube Channel Creation</div>
                <div>• Comprehensive Guide Videos</div>
                <div>• Enhanced Trading Features</div>
                <div>• Community Rewards Program</div>
              </PhaseDescription>
              <PreviewContainer>
                <PreviewButton onClick={() => handlePreview("Auto Sniper", 
                  "The Auto Sniper tool will revolutionize how you trade. Set custom parameters, execute precision trades, and never miss an opportunity with our advanced automation features.")}>
                  Auto Sniper
                </PreviewButton>
                <PreviewButton onClick={() => handlePreview("Trading Guides", 
                  "Access comprehensive video guides and tutorials showing you how to maximize your trading potential with our Auto Sniper tool and other platform features.")}>
                  Trading Guides
                </PreviewButton>
              </PreviewContainer>
            </PhaseContent>
          </Phase>

          <Phase position="right">
            <PhaseContent position="right">
              <PhaseTitle>Phase 3: Copy Trader Platform</PhaseTitle>
              <PhaseDescription>
                <div>• Copy Trader Platform Release</div>
                <div>• Advanced Trading Analytics</div>
                <div>• Portfolio Management Tools</div>
                <div>• Performance Tracking</div>
                <div>• Social Trading Features</div>
              </PhaseDescription>
              <PreviewContainer>
                <PreviewButton onClick={() => handlePreview("Copy Trading", 
                  "Our Copy Trader platform lets you automatically replicate successful trading strategies. Follow top performers, customize your copying parameters, and optimize your trading results.")}>
                  Copy Trading
                </PreviewButton>
                <PreviewButton onClick={() => handlePreview("Analytics", 
                  "Track your performance with advanced analytics. Monitor ROI, analyze trade history, and optimize your strategy with our comprehensive analytics dashboard.")}>
                  Analytics Suite
                </PreviewButton>
              </PreviewContainer>
            </PhaseContent>
          </Phase>

          <Phase position="left">
            <PhaseContent position="left">
              <PhaseTitle>Phase 4: Web Apps & Expansion</PhaseTitle>
              <PhaseDescription>
                <div>• Advanced Web Applications</div>
                <div>• Mobile App Development</div>
                <div>• Cross-chain Integration</div>
                <div>• Advanced Trading Bots</div>
                <div>• Institutional Tools</div>
              </PhaseDescription>
              <PreviewContainer>
                <PreviewButton onClick={() => handlePreview("Web Apps", 
                  "Coming soon: A suite of powerful web applications designed to enhance your trading experience. From advanced charting to automated trading systems.")}>
                  Web Apps
                </PreviewButton>
                <PreviewButton onClick={() => handlePreview("Trading Bots", 
                  "Our upcoming trading bots will offer customizable strategies, risk management features, and advanced automation capabilities for optimal trading performance.")}>
                  Trading Bots
                </PreviewButton>
              </PreviewContainer>
            </PhaseContent>
          </Phase>
        </RoadmapTimeline>

        {previewContent && (
          <PreviewModal onClick={closePreview}>
            <PreviewContent onClick={e => e.stopPropagation()}>
              <CloseButton onClick={closePreview}>×</CloseButton>
              <h3>{previewContent.title}</h3>
              <p>{previewContent.content}</p>
            </PreviewContent>
          </PreviewModal>
        )}
      </RoadmapContainer>
    </>
  );
};

export default Roadmap; 
