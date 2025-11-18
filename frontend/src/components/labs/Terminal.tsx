import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Typography, Chip, alpha, useTheme } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import CloseIcon from '@mui/icons-material/Close';

/**
 * Professional Terminal Component
 * Features: Command history, syntax highlighting, copy functionality
 * Note: In production, integrate with xterm.js for full terminal emulation
 */

interface TerminalProps {
  labId?: string;
  instanceId?: string;
  onClose?: () => void;
}

const Terminal: React.FC<TerminalProps> = ({ labId, instanceId, onClose }) => {
  const theme = useTheme();
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [output, setOutput] = useState<Array<{ type: 'input' | 'output' | 'error'; text: string }>>([
    { type: 'output', text: '╔════════════════════════════════════════════════════════════════╗' },
    { type: 'output', text: '║        AURON SECURITY LAB - TERMINAL v2.0.0                  ║' },
    { type: 'output', text: '╚════════════════════════════════════════════════════════════════╝' },
    { type: 'output', text: '' },
    { type: 'output', text: '🔒 Secure connection established...' },
    { type: 'output', text: '📡 Connected to lab environment' },
    { type: 'output', text: `🆔 Lab ID: ${labId || 'sandbox-001'}` },
    { type: 'output', text: '' },
    { type: 'output', text: 'Type "help" for available commands or "exit" to disconnect.' },
    { type: 'output', text: '' },
  ]);

  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected, setIsConnected] = useState(true);

  // Available commands (demo - replace with real shell commands in production)
  const commands: Record<string, (args: string[]) => string[]> = {
    help: () => [
      'Available commands:',
      '  help           - Show this help message',
      '  ls             - List files and directories',
      '  pwd            - Print working directory',
      '  whoami         - Display current user',
      '  cat <file>     - Display file contents',
      '  clear          - Clear terminal',
      '  date           - Show current date and time',
      '  uname          - Show system information',
      '  exit           - Disconnect from terminal',
      '',
      'Note: This is a demo terminal. In production, this connects to a real shell.',
    ],
    ls: () => [
      'drwxr-xr-x  5 auron  auron   160 Nov 18 12:34 .',
      'drwxr-xr-x  8 auron  auron   256 Nov 17 09:15 ..',
      '-rw-r--r--  1 auron  auron  1234 Nov 18 11:20 exploit.py',
      '-rw-r--r--  1 auron  auron   456 Nov 18 10:15 notes.txt',
      'drwxr-xr-x  3 auron  auron    96 Nov 17 14:22 payloads',
      '-rwxr-xr-x  1 auron  auron  2048 Nov 18 12:34 scan.sh',
    ],
    pwd: () => ['/home/auron/lab'],
    whoami: () => ['auron'],
    date: () => [new Date().toString()],
    uname: () => ['Linux auron-lab 5.15.0-1044-aws #49-Ubuntu SMP Thu Oct 6 02:08:18 UTC 2023 x86_64 GNU/Linux'],
    clear: () => [],
    cat: (args) => {
      if (args.length === 0) return ['cat: missing file operand'];
      if (args[0] === 'notes.txt') {
        return [
          '=== Security Lab Notes ===',
          '',
          '1. Check for SQL injection vulnerabilities',
          '2. Test XSS on input fields',
          '3. Enumerate open ports: nmap -sV target',
          '4. Try default credentials',
          '',
          '⚠️  Remember to log all findings!',
        ];
      }
      return [`cat: ${args[0]}: No such file or directory`];
    },
  };

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    // Add to history
    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    // Add command to output
    setOutput((prev) => [...prev, { type: 'input', text: `$ ${trimmed}` }]);

    // Handle exit
    if (trimmed === 'exit') {
      setOutput((prev) => [
        ...prev,
        { type: 'output', text: 'Connection closed. Goodbye!' },
      ]);
      setIsConnected(false);
      setTimeout(() => onClose?.(), 1500);
      return;
    }

    // Handle clear
    if (trimmed === 'clear') {
      setOutput([]);
      return;
    }

    // Parse command and arguments
    const parts = trimmed.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    // Execute command
    if (commands[command]) {
      const result = commands[command](args);
      setOutput((prev) => [
        ...prev,
        ...result.map((line) => ({ type: 'output' as const, text: line })),
      ]);
    } else {
      setOutput((prev) => [
        ...prev,
        { type: 'error', text: `Command not found: ${command}` },
        { type: 'output', text: 'Type "help" for available commands.' },
      ]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const copyToClipboard = () => {
    const text = output.map((line) => line.text).join('\n');
    navigator.clipboard.writeText(text);
  };

  const handleRefresh = () => {
    setOutput([
      { type: 'output', text: 'Reconnecting to lab environment...' },
      { type: 'output', text: '✓ Connection re-established' },
      { type: 'output', text: '' },
    ]);
    setIsConnected(true);
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [output]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark' ? '#0a0e27' : '#1a1d2e',
        borderRadius: 2,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
        boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.2)}`,
      }}
    >
      {/* Terminal Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          background: alpha(theme.palette.primary.main, 0.1),
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ff5f56',
            }}
          />
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#ffbd2e',
            }}
          />
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#27c93f',
            }}
          />
          <Typography
            variant="body2"
            sx={{ ml: 2, color: '#00ff41', fontFamily: 'monospace', fontWeight: 600 }}
          >
            auron@lab:~
          </Typography>
          <Chip
            label={isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: isConnected ? alpha('#00ff41', 0.2) : alpha('#ff5f56', 0.2),
              color: isConnected ? '#00ff41' : '#ff5f56',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: 20,
            }}
          />
        </Box>

        <Box>
          <IconButton size="small" onClick={copyToClipboard} sx={{ color: '#00ff41' }}>
            <ContentCopyIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleRefresh} sx={{ color: '#00ff41' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" sx={{ color: '#00ff41' }}>
            <FullscreenIcon fontSize="small" />
          </IconButton>
          {onClose && (
            <IconButton size="small" onClick={onClose} sx={{ color: '#ff5f56' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Terminal Output */}
      <Box
        ref={terminalRef}
        sx={{
          flex: 1,
          p: 2,
          overflowY: 'auto',
          fontFamily: '"Fira Code", "JetBrains Mono", monospace',
          fontSize: '0.9rem',
          lineHeight: 1.6,
          '&::-webkit-scrollbar': {
            width: 8,
          },
          '&::-webkit-scrollbar-track': {
            background: alpha('#000', 0.2),
          },
          '&::-webkit-scrollbar-thumb': {
            background: alpha('#00ff41', 0.3),
            borderRadius: 4,
            '&:hover': {
              background: alpha('#00ff41', 0.5),
            },
          },
        }}
      >
        {output.map((line, index) => (
          <Box
            key={index}
            sx={{
              color:
                line.type === 'input'
                  ? '#00d4ff'
                  : line.type === 'error'
                  ? '#ff5f56'
                  : '#00ff41',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              mb: 0.25,
              animation: 'fadeIn 0.2s ease-in',
              '@keyframes fadeIn': {
                '0%': { opacity: 0, transform: 'translateY(-2px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {line.text}
          </Box>
        ))}

        {/* Input Line */}
        {isConnected && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography sx={{ color: '#00d4ff', mr: 1 }}>$</Typography>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: 'inherit',
                caretColor: '#00ff41',
              }}
              autoFocus
            />
            <Box
              sx={{
                width: 8,
                height: 16,
                backgroundColor: '#00ff41',
                animation: 'blink 1s infinite',
                '@keyframes blink': {
                  '0%, 49%': { opacity: 1 },
                  '50%, 100%': { opacity: 0 },
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Terminal;
