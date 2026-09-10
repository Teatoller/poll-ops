import React, { useState } from 'react';

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

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    right: '0.5rem',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: '1.1rem',
    color: '#6b7280'
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
        required={required}
        style={{ paddingRight: '2.5rem' }}
        {...rest}
      />
      <button
        type="button"
        aria-label={show ? 'Hide password' : toggleAriaLabel || 'Show password'}
        onClick={() => setShow((s) => !s)}
        style={buttonStyle}
        tabIndex={0}
      >
        {show ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-7-11-7a20.3 20.3 0 0 1 3.11-4.11" />
            <path d="M1 1l22 22" />
            <path d="M9.88 9.88A3 3 0 0 0 14.12 14.12" />
            <path d="M12 5c2.5 0 4.71 1.28 6.16 3.16" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default PasswordField;
