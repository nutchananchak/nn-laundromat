import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
  width: 100%;
  height: 50px;
  font-size: 17px;
  font-weight: 600;
  color: #ffffff;
  background-color: ${(props) => (props.$variant === 'admin' ? '#0f172a' : '#1d61f2')};
  border: none;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: ${(props) =>
    props.$variant === 'admin'
      ? '0 4px 14px rgba(15, 23, 42, 0.25)'
      : '0 4px 14px rgba(29, 97, 242, 0.35)'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => (props.$variant === 'admin' ? '#1e293b' : '#144ecc')};
  }

  &:active {
    transform: scale(0.99);
  }
`;

const Button = ({ children, variant = 'primary', ...props }) => {
  return (
    <StyledButton $variant={variant} {...props}>
      {children}
    </StyledButton>
  );
};

export default Button;