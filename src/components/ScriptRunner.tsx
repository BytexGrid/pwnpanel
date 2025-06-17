import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import './ScriptRunner.css';

const ScriptRunner: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Output');
  const [scripts, setScripts] = useState<string[]>([]);
  const [selectedScript, setSelectedScript] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('Python');
  const [args, setArgs] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [readme, setReadme] = useState<string | null>('');
  const [license, setLicense] = useState<string | null>('');
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    const fetchScripts = async () => {
      const result = await window.api.getScripts();
      if (result.success) {
        setScripts(result.scripts);
      } else {
        console.error('Failed to get scripts:', result.error);
      }
    };
    fetchScripts();

    window.api.onScriptOutput((output) => {
      setOutput((prevOutput) => prevOutput + output);
    });
  }, []);

  useEffect(() => {
    if (selectedScript) {
      const fetchDocs = async () => {
        const result = await window.api.getToolDocs(selectedScript);
        if (result.success) {
          setReadme(result.readme);
          setLicense(result.license);
        }
      };
      fetchDocs();
    }
  }, [selectedScript]);

  const handleRunScript = async () => {
    if (!selectedScript) {
      alert('Please select a script to run.');
      return;
    }
    setOutput('');
    const language = selectedLanguage.toLowerCase();
    const command = language === 'python' ? 'python' : language;
    const scriptArgs = args.split(' ').filter(Boolean);
    window.api.logMessage(`[RUN_SCRIPT] Running script: ${command} ${selectedScript} with args: ${scriptArgs.join(' ')}`);
    await window.api.runCommand(command, [selectedScript, ...scriptArgs]);
  };

  return (
    <div className="script-runner">
      <h2>Script Runner</h2>
      <div className="script-controls">
        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}>
          <option>Python</option>
          <option>Bash</option>
          <option>Ruby</option>
        </select>
        <select value={selectedScript} onChange={(e) => setSelectedScript(e.target.value)}>
          <option value="">-- Select a script --</option>
          {scripts.map(script => (
            <option key={script} value={script}>{script.split(/[\\/]/).pop()}</option>
          ))}
        </select>
        <input type="text" placeholder="Arguments" value={args} onChange={(e) => setArgs(e.target.value)} />
        <button onClick={handleRunScript}>Run</button>
      </div>
      <div>
        <div className="script-tabs-container">
          <div className="script-tabs">
            <button onClick={() => setActiveTab('Output')} className={activeTab === 'Output' ? 'active' : ''}>Output</button>
            <button onClick={() => setActiveTab('README/Help')} className={activeTab === 'README/Help' ? 'active' : ''}>README/Help</button>
            <button onClick={() => setActiveTab('License')} className={activeTab === 'License' ? 'active' : ''}>License</button>
          </div>
          {activeTab === 'README/Help' && (
            <div className="zoom-controls">
              <button onClick={() => setZoomLevel(z => Math.max(0.5, z - 0.1))}>-</button>
              <span>{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(z => Math.min(2, z + 0.1))}>+</button>
            </div>
          )}
        </div>
        <div className="script-output">
          {activeTab === 'Output' && <pre>{output}</pre>}
          {activeTab === 'README/Help' && 
            <div className="markdown-content" style={{ fontSize: `${zoomLevel}rem` }}>
              <ReactMarkdown rehypePlugins={[rehypeRaw]}>{readme || 'No README found.'}</ReactMarkdown>
            </div>
          }
          {activeTab === 'License' && <pre>{license || 'No LICENSE found.'}</pre>}
        </div>
      </div>
    </div>
  );
};

export default ScriptRunner; 