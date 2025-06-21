import React, { useState } from 'react';
import './PasswordDialog.css';

interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  toolName: string;
}

const PasswordDialog: React.FC<PasswordDialogProps> = ({ isOpen, onClose, onSubmit, toolName }) => {
  const [password, setPassword] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password) {
      onSubmit(password);
      setPassword('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <h3>Sudo Password Required</h3>
          <p>The installation for <strong>{toolName}</strong> requires administrator privileges.</p>
          <label htmlFor="password">Please enter your password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <div className="modal-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Install</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordDialog; 