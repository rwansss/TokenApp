import React from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';

const RoadmapContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0d14 0%, #1a1f2c 100%);
  color: #ffffff;
  padding: 2rem;
  position: relative;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 3rem;
  
  h1 {
    font-family: 'Satoshi', sans-serif;
    font-size: 4rem;
    background: linear-gradient(90deg, #00ff9d, #00a3ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 1rem;
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

const PhaseGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const PhaseCard = styled.div`
  background: rgba(22, 27, 34, 0.95);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(0, 255, 157, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    border-color: #00ff9d;
    box-shadow: 0 8px 32px rgba(0, 255, 157, 0.1);
  }

  h2 {
    color: #00ff9d;
    font-size: 1.8rem;
    margin-bottom: 1.5rem;
    font-family: 'Satoshi', sans-serif;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;

    li {
      margin-bottom: 1rem;
      padding-left: 1.5rem;
      position: relative;
      color: #8b949e;

      &:before {
        content: '•';
        color: #00ff9d;
        position: absolute;
        left: 0;
      }
    }
  }
`;

function Roadmap() {
  return (
    <RoadmapContainer>
      <BackButton to="/">← Back to Home</BackButton>
      <Header>
        <h1>LAUNCHX Roadmap</h1>
      </Header>
      
      <PhaseGrid>
        <PhaseCard>
          <h2>Phase 1: Launch of LAUNCHX $LAX</h2>
          <ul>
            <li>Initial token launch on XRPL</li>
            <li>Token Creator Platform Release</li>
            <li>Website and Documentation</li>
            <li>Marketing Campaigns</li>
            <li>Partnership Announcements</li>
          </ul>
        </PhaseCard>

        <PhaseCard>
          <h2>Phase 2: Auto Sniper Release</h2>
          <ul>
            <li>Auto Sniper Tool Launch</li>
            <li>YouTube Channel Creation</li>
            <li>Comprehensive Guide Videos</li>
            <li>Enhanced Trading Features</li>
            <li>Community Rewards Program</li>
          </ul>
        </PhaseCard>

        <PhaseCard>
          <h2>Phase 3: Copy Trader Platform</h2>
          <ul>
            <li>Copy Trader Platform Release</li>
            <li>Advanced Trading Analytics</li>
            <li>Portfolio Management Tools</li>
            <li>Performance Tracking</li>
            <li>Social Trading Features</li>
          </ul>
        </PhaseCard>

        <PhaseCard>
          <h2>Phase 4: Web Apps & Expansion</h2>
          <ul>
            <li>Advanced Web Applications</li>
            <li>Mobile App Development</li>
            <li>Cross-chain Integration</li>
            <li>Advanced Trading Bots</li>
            <li>Institutional Tools</li>
          </ul>
        </PhaseCard>
      </PhaseGrid>
    </RoadmapContainer>
  );
}

export default Roadmap; 
