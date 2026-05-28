import React from 'react';

interface IPMaskProps {
  ip?: string | null;
  className?: string;
  showPrefix?: boolean;
}

export const IPMask: React.FC<IPMaskProps> = ({ ip, className = "", showPrefix = true }) => {
  if (!ip) {
    return <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>;
  }

  const ipStr = String(ip).trim();

  // Check if IP contains the subnet to be hidden
  if (ipStr.includes('112.133.201')) {
    // Extract the last part of the IP address (usually the last 2 digits, e.g. 112.133.201.83 -> 83)
    const match = ipStr.match(/\d+$/);
    const lastDigits = match ? match[0].slice(-2) : ipStr.slice(-2);

    return (
      <span className={`inline-flex items-center font-mono ${className}`}>
        {showPrefix && (
          <span className="text-slate-400/30 dark:text-slate-500/25 select-none mr-0.5 tracking-normal">
            •••.•••.•••.
          </span>
        )}
        <span 
          className="text-cyan-500 dark:text-cyan-400 font-bold transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{
            textShadow: '0 0 8px rgba(6, 182, 212, 0.85), 0 0 16px rgba(6, 182, 212, 0.45)',
          }}
          title={`Protected Connection (Prefix hidden)`}
        >
          {lastDigits}
        </span>
      </span>
    );
  }

  // Fallback for general IP masking if it contains another IP format (optional but clean)
  // Let's check if it matches a general IPv4 format:
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ipStr)) {
    const parts = ipStr.split('.');
    const lastOctet = parts[3];
    const lastDigits = lastOctet.slice(-2);
    return (
      <span className={`inline-flex items-center font-mono ${className}`}>
        {showPrefix && (
          <span className="text-slate-400/30 dark:text-slate-500/25 select-none mr-0.5 tracking-normal">
            •••.•••.•••.
          </span>
        )}
        <span 
          className="text-cyan-500 dark:text-cyan-400 font-bold"
          style={{
            textShadow: '0 0 8px rgba(6, 182, 212, 0.85), 0 0 16px rgba(6, 182, 212, 0.45)',
          }}
        >
          {lastDigits}
        </span>
      </span>
    );
  }

  return <span className={`font-mono ${className}`}>{ipStr}</span>;
};

// Utility function to get plain text representation (e.g. for reports, titles, alerts)
export function getMaskedIPText(ip?: string | null): string {
  if (!ip) return 'N/A';
  const ipStr = String(ip).trim();
  if (ipStr.includes('112.133.201')) {
    const match = ipStr.match(/\d+$/);
    const lastDigits = match ? match[0].slice(-2) : ipStr.slice(-2);
    return `•••.•••.•••.${lastDigits}`;
  }
  return ipStr;
}

export default IPMask;
