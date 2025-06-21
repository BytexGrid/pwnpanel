import React, { useRef, useEffect } from 'react';

interface TerminalTabProps {
  output: string;
  exitCode?: number | null;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ output, exitCode }) => {
  const outputEndRef = useRef<HTMLDivElement>(null);

  // This effect ensures the view auto-scrolls to the bottom as new output arrives.
  useEffect(() => {
    outputEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output]);

  return (
    <div className="terminal-tab">
      <pre>
        <code>
          {output}
          {exitCode !== null && exitCode !== undefined && (
            <div className="exit-code">
              Process finished with exit code: {exitCode}
            </div>
          )}
        </code>
      </pre>
      <div ref={outputEndRef} />
    </div>
  );
};

export default TerminalTab; 