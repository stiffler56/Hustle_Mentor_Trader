import React from 'react';

const TERMINAL_URL = 'https://mt5-sim1.fundingpips.com/terminal';

export default function BrokerIntegration() {
  return (
    <div className="w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0B0C0E]">
      <iframe
        src={TERMINAL_URL}
        title="Funding Pips MT5 WebTerminal"
        className="w-full h-full border-0 block"
        allow="clipboard-read; clipboard-write; fullscreen; web-share"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </div>
  );
}
