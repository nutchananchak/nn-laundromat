import React from 'react';
import styled from 'styled-components';

const FormGroup = styled.div`
  margin-bottom: 16px;
  text-align: left;
  width: 100%;
`;

const Label = styled.label`
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 8px;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 48px;
  padding: 0 16px;
  font-size: 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  background-color: #ffffff;
  box-sizing: border-box;
  outline: none;
  transition: all 0.2s ease-in-out;

  &:focus {
    border-color: #1d61f2;
    box-shadow: 0 0 0 4px rgba(29, 97, 242, 0.12);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const Input = ({ label, id, ...props }) => {
  return (
    <FormGroup>
      {label && <Label htmlFor={id}>{label}</Label>}
      <StyledInput id={id} {...props} />
    </FormGroup>
  );
};

export default Input;