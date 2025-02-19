import React, { useState, useEffect } from 'react';
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

const glowAnimation = keyframes`
  0% { box-shadow: 0 0 5px rgba(0, 255, 157, 0.2); }
  50% { box-shadow: 0 0 20px rgba(0, 255, 157, 0.4); }
  100% { box-shadow: 0 0 5px rgba(0, 255, 157, 0.2); }
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
  animation: ${fadeIn} 0.3s ease;
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

const Section = styled.div`
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: rgba(13, 17, 23, 0.5);
  border-radius: 12px;
  border: 1px solid rgba(48, 54, 61, 0.5);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 157, 0.1);
  }
`;

const StepTitle = styled.h3`
  color: #ffffff;
  margin-bottom: 1.2rem;
  font-size: 1.3rem;
  font-family: 'Rajdhani', sans-serif;
  display: flex;
  align-items: center;
  gap: 0.8rem;

  &::before {
    content: '${props => props.number || "•"}';
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: rgba(0, 255, 157, 0.1);
    border-radius: 50%;
    font-size: 0.9rem;
    color: #00ff9d;
  }
`;

const StepContent = styled.div`
  color: #8b949e;
  margin-bottom: 1.5rem;
  line-height: 1.8;
  font-size: 1.1rem;

  code {
    background: rgba(13, 17, 23, 0.7);
    padding: 0.3rem 0.6rem;
    border-radius: 4px;
    color: #00ff9d;
    font-family: 'Fira Code', monospace;
    font-size: 0.9rem;
    border: 1px solid rgba(0, 255, 157, 0.2);
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background: ${props => props.primary ? 'rgba(0, 255, 157, 0.1)' : 'rgba(22, 27, 34, 0.8)'};
  color: ${props => props.primary ? '#00ff9d' : '#fff'};
  border: 1px solid ${props => props.primary ? '#00ff9d' : '#30363d'};
  border-radius: 12px;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 1rem;
  backdrop-filter: blur(4px);
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 255, 157, 0.2);
    background: ${props => props.primary ? 'rgba(0, 255, 157, 0.2)' : 'rgba(22, 27, 34, 0.9)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  background: rgba(13, 17, 23, 0.7);
  border: 1px solid #30363d;
  border-radius: 12px;
  color: white;
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  
  &:focus {
    border-color: #00ff9d;
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 157, 0.2);
  }

  &::placeholder {
    color: #8b949e;
  }
`;

const HostingOption = styled.div`
  border: 1px solid ${props => props.selected ? '#00ff9d' : '#30363d'};
  border-radius: 12px;
  padding: 1.8rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: ${props => props.selected ? 'rgba(0, 255, 157, 0.05)' : 'rgba(22, 27, 34, 0.5)'};
  animation: ${props => props.selected ? glowAnimation : 'none'} 2s infinite;
  
  &:hover {
    border-color: #00ff9d;
    transform: translateY(-2px);
  }

  h4 {
    color: ${props => props.selected ? '#00ff9d' : '#ffffff'};
    margin: 0 0 0.5rem 0;
    font-size: 1.2rem;
    font-family: 'Rajdhani', sans-serif;
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  p {
    color: #8b949e;
    margin: 0;
    font-size: 1rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(48, 54, 61, 0.5);
  gap: 1rem;
`;

export const HostingGuideModal = ({ 
  isOpen, 
  onClose, 
  onDomainSubmit,
  tokenSymbol,
  step,
  onNext,
  onBack
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [domain, setDomain] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedOption(null);
      setDomain('');
    }
  }, [isOpen]);

  const handleClose = (e) => {
    if (e) e.stopPropagation();
    onClose();
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    onNext();
  };

  const handleBack = (e) => {
    if (e) e.stopPropagation();
    onBack();
  };

  const handleSubmit = (e) => {
    if (e) e.stopPropagation();
    if (domain.trim()) {
      onDomainSubmit(domain.trim());
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <Title>TOML Hosting Guide</Title>
        
        {step === 1 && (
          <>
            <Section>
              <StepTitle>Choose Hosting Option</StepTitle>
              <HostingOption
                selected={selectedOption === 'github'}
                onClick={() => handleOptionSelect('github')}
              >
                <h4>GitHub Pages</h4>
                <p>Free, simple hosting with version control</p>
              </HostingOption>
              
              <HostingOption
                selected={selectedOption === 'netlify'}
                onClick={() => handleOptionSelect('netlify')}
              >
                <h4>Netlify</h4>
                <p>Fast, reliable hosting with drag & drop deployment</p>
              </HostingOption>
            </Section>
            
            <ButtonContainer>
              <Button onClick={handleClose}>Cancel</Button>
              <Button 
                primary 
                onClick={handleNext}
                disabled={!selectedOption}
              >
                Next
              </Button>
            </ButtonContainer>
          </>
        )}

        {step === 2 && (
          <>
            {selectedOption === 'github' && (
              <Section>
                <StepTitle>GitHub Pages Guide</StepTitle>
                <StepContent>
                  1. Create a new repository on GitHub<br />
                  2. Create a folder named <code>.well-known</code><br />
                  3. Upload your <code>{tokenSymbol?.toLowerCase()}.toml</code> file as <code>xrp-ledger.toml</code><br />
                  4. Enable GitHub Pages in repository settings<br />
                  5. Your TOML will be available at: <code>https://[username].github.io/.well-known/xrp-ledger.toml</code>
                </StepContent>
              </Section>
            )}
            {selectedOption === 'netlify' && (
              <Section>
                <StepTitle>Netlify Guide</StepTitle>
                <StepContent>
                  1. Go to app.netlify.com and sign up/login<br />
                  2. Create a new site by drag & drop<br />
                  3. Create a folder named <code>.well-known</code><br />
                  4. Place your <code>{tokenSymbol?.toLowerCase()}.toml</code> file inside as <code>xrp-ledger.toml</code><br />
                  5. Drag the folder to Netlify's upload area<br />
                  6. Your TOML will be available at: <code>https://[your-site-name].netlify.app/.well-known/xrp-ledger.toml</code>
                </StepContent>
              </Section>
            )}
            
            <ButtonContainer>
              <Button onClick={handleBack}>Back</Button>
              <Button primary onClick={handleNext}>Next</Button>
            </ButtonContainer>
          </>
        )}

        {step === 3 && (
          <Section>
            <StepTitle>Enter Your Domain</StepTitle>
            <StepContent>
              Enter the domain where you've hosted your TOML file:
            </StepContent>
            <Input
              type="text"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <ButtonContainer>
              <Button onClick={handleBack}>Back</Button>
              <Button 
                primary 
                onClick={handleSubmit}
                disabled={!domain.trim()}
              >
                Verify & Submit
              </Button>
            </ButtonContainer>
          </Section>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}; 