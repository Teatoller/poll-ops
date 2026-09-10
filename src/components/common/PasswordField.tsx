import React, { useState } from 'react';
import './PasswordField.css';

interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  toggleAriaLabel?: string;
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder,
  className,
  required,
  toggleAriaLabel,
  ...rest
}) => {
  const [show, setShow] = useState(false);

  return (
    <div className="password-field-wrapper">
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`${className ? className : ''} password-input`}
        required={required}
        {...rest}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : toggleAriaLabel || 'Show password'}
        onClick={() => setShow((s) => !s)}
        className="password-toggle"
        tabIndex={0}
      >
        <img
          src={show ? '/icons/eye-off.svg' : '/icons/eye.svg'}
          alt=""
          aria-hidden="true"
        />
      </button>
    </div>
  );
};

export default PasswordField;
