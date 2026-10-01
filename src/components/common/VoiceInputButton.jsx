import React, { useState, useRef } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';
import { startUniversalSpeechListener } from '../../services/voiceAssistantService';

/**
 * Universal Voice Mic Button for any text field or form input
 * Props:
 *  - onTranscript: (text) => void
 *  - size: number (default 16)
 *  - placeholder: string
 *  - style: object
 */
export const VoiceInputButton = ({
  onTranscript,
  onVoiceInput,
  onResult,
  size = 15,
  title,
  tooltip,
  style = {}
}) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const callback = onVoiceInput || onTranscript || onResult;
  const buttonTitle = tooltip || title || 'মুখে বাংলায় বলুন (ভয়েস টাইপিং)';
  const iconSize = typeof size === 'number' ? size : (size === 'sm' ? 14 : size === 'lg' ? 18 : 15);

  const toggleListen = (e) => {
    if (e) e.preventDefault();

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    const recognition = startUniversalSpeechListener({
      lang: 'bn-BD',
      continuous: false,
      onResult: (finalStr) => {
        setIsListening(false);
        if (finalStr && callback) {
          callback(finalStr);
        }
      },
      onError: (err) => {
        console.warn('Voice input error:', err);
        setIsListening(false);
      },
      onEnd: () => {
        setIsListening(false);
      }
    });

    if (recognition) {
      recognitionRef.current = recognition;
      setIsListening(true);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleListen}
      title={isListening ? 'শুনছি... বন্ধ করতে ক্লিক করুন' : buttonTitle}
      style={{
        background: isListening
          ? 'linear-gradient(135deg, #ef4444, #f97316)'
          : 'var(--bg-secondary)',
        color: isListening ? '#fff' : 'var(--text-muted)',
        border: isListening ? '1.5px solid #ef4444' : '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '5px 8px',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        transition: 'all 0.2s',
        boxShadow: isListening ? '0 0 12px rgba(239, 68, 68, 0.45)' : 'none',
        flexShrink: 0,
        ...style
      }}
      onMouseEnter={(e) => {
        if (!isListening) {
          e.currentTarget.style.borderColor = 'var(--business-primary)';
          e.currentTarget.style.color = 'var(--text-main)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isListening) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.color = 'var(--text-muted)';
        }
      }}
    >
      {isListening ? (
        <>
          <Mic size={iconSize} className="animate-pulse" />
          <span style={{ fontSize: '0.68rem', fontWeight: '800' }}>শুনছি...</span>
        </>
      ) : (
        <Mic size={iconSize} />
      )}
    </button>
  );
};
