import React from 'react';
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
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  padding-left: 3rem;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #00ff9d;
  }
`;

const Phase = styled.div`
  position: relative;
  margin-bottom: 6rem;
  padding-left: 2rem;

  &::before {
    content: '';
    position: absolute;
    left: -3rem;
    top: 0;
    width: 16px;
    height: 16px;
    background: #00ff9d;
    border-radius: 50%;
    box-shadow: 0 0 20px rgba(0, 255, 157, 0.5);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const PhaseTitle = styled.h2`
  color: #00ff9d;
  font-size: 2rem;
  margin-bottom: 1.5rem;
  font-family: 'Satoshi', sans-serif;
`;

const PhaseContent = styled.div`
  background: rgba(0, 255, 157, 0.05);
  border: 1px solid rgba(0, 255, 157, 0.2);
  border-radius: 12px;
  padding: 2rem;
`;

const FeatureList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem 0;

  li {
    color: #8b949e;
    margin-bottom: 0.8rem;
    padding-left: 1.5rem;
    position: relative;

    &::before {
      content: '•';
      color: #00ff9d;
      position: absolute;
      left: 0;
    }
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
`;

const FeatureButton = styled.button`
  background: transparent;
  border: 1px solid #00ff9d;
  color: #00ff9d;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 255, 157, 0.1);
    transform: translateY(-2px);
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

function Roadmap() {
  return (
    <>
      <GlobalStyle />
      <RoadmapContainer>
        <BackButton to="/">← Back to Home</BackButton>
        <Header>
          <h1>LAUNCHX ROADMAP</h1>
        </Header>
        
        <Timeline>
          <Phase>
            <PhaseTitle>Phase 1: Launch of LAUNCHX $LAX</PhaseTitle>
            <PhaseContent>
              <FeatureList>
                <li>Initial token launch on XRPL</li>
                <li>Token Creator Platform Release</li>
                <li>Website and Documentation</li>
                <li>Marketing Campaigns</li>
                <li>Partnership Announcements</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton>Token Creator</FeatureButton>
                <FeatureButton>Launch Features</FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase>
            <PhaseTitle>Phase 2: Auto Sniper Release</PhaseTitle>
            <PhaseContent>
              <FeatureList>
                <li>Auto Sniper Tool Launch</li>
                <li>YouTube Channel Creation</li>
                <li>Comprehensive Guide Videos</li>
                <li>Enhanced Trading Features</li>
                <li>Community Rewards Program</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton>Auto Sniper</FeatureButton>
                <FeatureButton>Trading Guides</FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase>
            <PhaseTitle>Phase 3: Copy Trader Platform</PhaseTitle>
            <PhaseContent>
              <FeatureList>
                <li>Copy Trader Platform Release</li>
                <li>Advanced Trading Analytics</li>
                <li>Portfolio Management Tools</li>
                <li>Performance Tracking</li>
                <li>Social Trading Features</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton>Copy Trading</FeatureButton>
                <FeatureButton>Analytics Suite</FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>

          <Phase>
            <PhaseTitle>Phase 4: Web Apps & Expansion</PhaseTitle>
            <PhaseContent>
              <FeatureList>
                <li>Advanced Web Applications</li>
                <li>Mobile App Development</li>
                <li>Cross-chain Integration</li>
                <li>Advanced Trading Bots</li>
                <li>Institutional Tools</li>
              </FeatureList>
              <ButtonGroup>
                <FeatureButton>Web Apps</FeatureButton>
                <FeatureButton>Trading Bots</FeatureButton>
              </ButtonGroup>
            </PhaseContent>
          </Phase>
        </Timeline>
      </RoadmapContainer>
    </>
  );
}

export default Roadmap; 
