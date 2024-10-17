import React from 'react';

interface LogDisplayProps {
  logs: string[];
}

const LogDisplay: React.FC<LogDisplayProps> = ({ logs }) => {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-2">Logs em Tempo Real</h3>
      <div className="bg-gray-100 p-4 rounded-lg h-64 overflow-y-auto">
        {logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
    </div>
  );
};

export default LogDisplay;