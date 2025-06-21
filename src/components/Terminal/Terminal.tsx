import React from 'react';
import './Terminal.css';
import TerminalTab from './TerminalTab';
import { TerminalSession } from '../../renderer';

interface TerminalProps {
  sessions: TerminalSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  closeTab: (sessionId: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ sessions, activeSessionId, setActiveSessionId, closeTab }) => {
  const activeSessionData = sessions.find(s => s.sessionId === activeSessionId);

  return (
    <div className="terminal-container">
      <div className="terminal-tabs-header">
        {sessions.map(session => (
          <div
            key={session.sessionId}
            className={`tab-item ${session.sessionId === activeSessionId ? 'active' : ''}`}
            onClick={() => setActiveSessionId(session.sessionId)}
          >
            {session.title}
            <button className="close-tab" onClick={(e) => { e.stopPropagation(); closeTab(session.sessionId); }}>×</button>
          </div>
        ))}
      </div>
      <div className="terminal-content">
        {activeSessionData ? (
          <TerminalTab output={activeSessionData.output} exitCode={activeSessionData.exitCode} />
        ) : (
          <div className="no-active-session">
            <p>No active terminal sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal; 