import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="form-group">
        {label && <label className="form-label">{label}</label>}
        <input
          ref={ref}
          className={`form-input ${error ? 'input-error' : ''} ${className}`.trim()}
          {...props}
        />
        {error && <span className="form-error text-neg">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';

