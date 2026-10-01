import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Mic,
  MicOff,
  X,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertCircle,
  Plus,
  Package,
  Layers,
  ArrowRight,
  Radio,
  Zap,
  HelpCircle
} from 'lucide-react';
import {
  parseBengaliVoiceCommand,
  matchVoiceProduct,
  resolveSelectionVoice,
  generateClarificationVoicePrompt,
  speakVoiceConfirmation,
  parseMultiItemVoiceCommand,
  parsePOSVoiceActionCommand
} from '../../services/voiceBillingService';
import { triggerHaptic } from '../../services/imageRecognitionService';

export const VoiceBillingModal = ({ isOpen, onClose, onAddToCart, onPOSAction }) => {
  const { products, lang, showToast } = useApp();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [matchedResults, setMatchedResults] = useState([]);
  const [isContinuous, setIsContinuous] = useState(true);
  const [speechFeedback, setSpeechFeedback] = useState(true);
  const [recentAddedList, setRecentAddedList] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // Multi-turn interactive voice dialogue states
  const [dialogueState, setDialogueState] = useState('idle'); // 'idle' | 'awaiting_selection'
  const [pendingCandidates, setPendingCandidates] = useState([]);
  const [pendingInitialQuantity, setPendingInitialQuantity] = useState(1);
  const [pendingQuery, setPendingQuery] = useState('');

  const recognitionRef = useRef(null);
  const restartTimerRef = useRef(null);

  // Check Web Speech API support
  const isSpeechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      setTranscript('');
      setInterimTranscript('');
      setParsedData(null);
      setMatchedResults([]);
      setDialogueState('idle');
      setPendingCandidates([]);
      setPendingQuery('');
      return;
    }

    if (!isSpeechSupported) {
      setErrorMessage(
        lang === 'bn'
          ? 'আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট নেই। Chrome অথবা Edge ব্রাউজার ব্যবহার করুন, অথবা নিচের দ্রুত ভয়েস টেস্ট সিমুলেটর ব্যবহার করুন।'
          : 'Speech Recognition API not supported in this browser. Please use Chrome/Edge or the test buttons.'
      );
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD'; // Bengali (Bangladesh)

    recognition.onstart = () => {
      setIsListening(true);
      setErrorMessage(null);
    };

    recognition.onresult = (event) => {
      let finalStr = '';
      let interimStr = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalStr += event.results[i][0].transcript;
        } else {
          interimStr += event.results[i][0].transcript;
        }
      }

      if (interimStr) {
        setInterimTranscript(interimStr);
      }

      if (finalStr) {
        setTranscript(finalStr);
        setInterimTranscript('');
        handleProcessVoiceCommand(finalStr);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setErrorMessage(
          lang === 'bn'
            ? 'মাইক্রোফোন পারমিশন ব্লক করা আছে। দয়া করে ব্রাউজারের অ্যাড্রেস বার থেকে মাইক্রোফোন অ্যালাউ করুন।'
            : 'Microphone permission blocked. Please allow mic in browser settings.'
        );
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Just silent, keep continuous
      }
    };

    recognition.onend = () => {
      if (isContinuous && isOpen) {
        // Auto restart for non-stop cashier billing
        restartTimerRef.current = setTimeout(() => {
          try {
            recognition.start();
          } catch {
            // ignore
          }
        }, 300);
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    // Auto start on open
    try {
      recognition.start();
    } catch (e) {
      console.warn('Initial mic start error:', e);
    }

    return () => {
      stopListening();
    };
  }, [isOpen, isContinuous, dialogueState, pendingCandidates, pendingInitialQuantity]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      // already active
    }
  };

  const stopListening = () => {
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Add confirmed item to cart and recent list with spoken feedback
  const confirmAndAddToCart = (product, quantity, unit = '') => {
    const qty = Math.max(1, quantity || 1);

    if (onAddToCart) {
      onAddToCart(product, qty);
    }

    const addedRecord = {
      id: Date.now(),
      productName: product.name,
      quantity: qty,
      unit: unit || product.unit || '',
      price: product.sellingPrice,
      time: new Date().toLocaleTimeString()
    };
    setRecentAddedList(prev => [addedRecord, ...prev].slice(0, 6));

    if (speechFeedback) {
      const spokenQty = qty > 1 ? `${qty}টি ` : '';
      const announceText = `${spokenQty}${product.name} কার্টে যোগ হয়েছে।`;
      speakVoiceConfirmation(announceText, lang);
    }

    showToast(
      lang === 'bn'
        ? `🗣️ কার্টে যোগ হয়েছে: ${qty}x ${product.name}`
        : `Added: ${qty}x ${product.name}`,
      'success'
    );
  };

  // Cancel multi-turn candidate selection
  const handleCancelSelection = () => {
    setDialogueState('idle');
    setPendingCandidates([]);
    setPendingQuery('');
    if (speechFeedback) {
      speakVoiceConfirmation('বাছাই বাতিল করা হয়েছে। নতুন পণ্য বলুন।', lang);
    }
    showToast(lang === 'bn' ? 'বাছাই বাতিল করা হয়েছে' : 'Selection cancelled', 'info');
  };

  // Select a candidate manually by click
  const handleSelectCandidateByClick = (candidate) => {
    triggerHaptic([30, 20]);
    confirmAndAddToCart(candidate.product, pendingInitialQuantity || 1, candidate.matchedUnit);
    setDialogueState('idle');
    setPendingCandidates([]);
    setPendingQuery('');
  };

  // Process the spoken sentence into cart items or multi-turn clarification
  const handleProcessVoiceCommand = (sentence) => {
    if (!sentence || !sentence.trim()) return;

    triggerHaptic([40, 30, 40]);

    // Check POS Voice Action (Discount, Clear Cart, Open Drawer, Checkout, Payment Method)
    const posAction = parsePOSVoiceActionCommand(sentence);
    if (posAction) {
      if (onPOSAction) {
        onPOSAction(posAction);
      }
      if (speechFeedback) {
        speakVoiceConfirmation(posAction.spoken, lang);
      }
      showToast(posAction.spoken, 'success');
      return;
    }

    // ==========================================
    // Turn 2: Currently Awaiting Follow-up Selection
    // ==========================================
    if (dialogueState === 'awaiting_selection' && pendingCandidates.length > 0) {
      const resolution = resolveSelectionVoice(sentence, pendingCandidates, products);

      if (resolution?.isCancelled) {
        handleCancelSelection();
        return;
      }

      if (resolution?.selectedCandidate) {
        // Quantity can be either newly spoken ("২টা লাক্স", "১০ কেজি প্রাণ চাল") or carried from turn 1
        const finalQty = resolution.quantity > 0 ? resolution.quantity : (pendingInitialQuantity || 1);
        const finalUnit = resolution.unit || resolution.selectedCandidate.matchedUnit || resolution.selectedCandidate.product?.unit || '';
        confirmAndAddToCart(resolution.selectedCandidate.product, finalQty, finalUnit);

        // Reset to normal idle state
        setDialogueState('idle');
        setPendingCandidates([]);
        setPendingQuery('');
        return;
      }

      // If user spoke a totally new command instead of choosing candidate, check if it's a new product
      const newParsed = parseBengaliVoiceCommand(sentence);
      const newMatches = matchVoiceProduct(newParsed, products);

      if (newMatches.directMatch || (newMatches.isAmbiguous && newMatches.candidates.length > 0)) {
        // Switched context to a new product
        if (newMatches.isAmbiguous) {
          setDialogueState('awaiting_selection');
          setPendingCandidates(newMatches.candidates);
          setPendingInitialQuantity(newParsed.quantity || 1);
          setPendingQuery(newParsed.productQuery || sentence);
          setParsedData(newParsed);

          const promptText = generateClarificationVoicePrompt(newMatches.candidates, newParsed.productQuery);
          if (speechFeedback) speakVoiceConfirmation(promptText, lang);
          return;
        } else {
          confirmAndAddToCart(newMatches.directMatch.product, newParsed.quantity || 1, newParsed.unit);
          setDialogueState('idle');
          setPendingCandidates([]);
          setPendingQuery('');
          return;
        }
      }

      // If unresolved in candidate state
      if (speechFeedback) {
        speakVoiceConfirmation('তালিকা থেকে পছন্দের পণ্যের নাম ও পরিমাণ বলুন, যেমন প্রাণ চাল ১০ কেজি বা এক নম্বর।', lang);
      }
      showToast(
        lang === 'bn'
          ? 'সঠিক অপশনটি বলুন (যেমন: "প্রাণ চাল ১০ কেজি" বা "১ নম্বর") অথবা কার্ডে ক্লিক করুন'
          : 'Please say index (e.g. "1") or product name',
        'warning'
      );
      return;
    }

    // ==========================================
    // Turn 1: Normal Initial Command
    // ==========================================

    // Check if user spoke multiple items in a single breath (e.g., "২ কেজি চিনি, ৩ লিটার তেল আর ১ প্যাকেট লবণ")
    const multiItemResult = parseMultiItemVoiceCommand(sentence, products);
    if (multiItemResult && multiItemResult.items && multiItemResult.items.length >= 2) {
      multiItemResult.items.forEach(it => {
        if (onAddToCart) {
          onAddToCart(it.product, it.quantity);
        }
      });
      const namesList = multiItemResult.items.map(it => `${it.quantity} ${it.unit || ''} ${it.product.name}`).join(', ');
      const newRecords = multiItemResult.items.map(it => ({
        id: Date.now() + Math.random(),
        productName: it.product.name,
        quantity: it.quantity,
        unit: it.unit || it.product.unit || '',
        price: it.product.sellPrice || it.product.sellingPrice,
        time: new Date().toLocaleTimeString()
      }));
      setRecentAddedList(prev => [...newRecords, ...prev].slice(0, 8));

      if (speechFeedback) {
        const spoken = `${multiItemResult.itemCount}টি পণ্য কার্টে যোগ হয়েছে। আনুমানিক মোট বিল ${Math.round(multiItemResult.totalAmount)} টাকা।`;
        speakVoiceConfirmation(spoken, lang);
      }
      showToast(
        lang === 'bn'
          ? `🗣️ ${multiItemResult.itemCount}টি পণ্য কার্টে যোগ হয়েছে (মোট: ৳${Math.round(multiItemResult.totalAmount).toLocaleString()})`
          : `Added ${multiItemResult.itemCount} items to cart!`,
        'success'
      );
      setParsedData({
        productQuery: namesList,
        quantity: multiItemResult.itemCount,
        unit: 'টি পণ্য',
        rawText: sentence
      });
      return;
    }

    const parsed = parseBengaliVoiceCommand(sentence);
    setParsedData(parsed);

    const matchResult = matchVoiceProduct(parsed, products);
    setMatchedResults(matchResult.candidates);

    // Scenario A: Ambiguous / Category Search (e.g. "চাল", "তেল", "সাবান", "চাল দেখাও")
    if (matchResult.isAmbiguous && matchResult.candidates.length > 0) {
      setDialogueState('awaiting_selection');
      setPendingCandidates(matchResult.candidates);
      setPendingInitialQuantity(parsed.quantity || 1);
      setPendingQuery(parsed.productQuery || sentence);

      const promptText = generateClarificationVoicePrompt(matchResult.candidates, parsed.productQuery);
      if (speechFeedback) {
        speakVoiceConfirmation(promptText, lang);
      }

      showToast(
        lang === 'bn'
          ? `🔍 "${parsed.productQuery || 'পণ্য'}" এর ${matchResult.candidates.length}টি বিকল্প পাওয়া গেছে। বলুন বা কার্ডে ক্লিক করুন।`
          : `Found ${matchResult.candidates.length} options. Speak or click to select.`,
        'info'
      );
      return;
    }

    // Scenario B: Overwhelming Direct Match (e.g. "১টি লাক্স সাবান", "২৫ কেজি মিনিকেট চাল", "১ লিটার সরিষার তেল")
    if (matchResult.directMatch) {
      confirmAndAddToCart(matchResult.directMatch.product, parsed.quantity || 1, parsed.unit);
      return;
    }

    // Scenario C: No Match
    if (speechFeedback) {
      speakVoiceConfirmation('দুঃখিত, এই নামের কোনো পণ্য খুঁজে পাওয়া যায়নি।', lang);
    }
    showToast(
      lang === 'bn'
        ? `"${parsed.productQuery || sentence}" পণ্যের তালিকায় পাওয়া যায়নি`
        : `No product match found for "${parsed.productQuery || sentence}"`,
      'warning'
    );
  };

  // Quick 1-click preset simulation for testing or quick billing
  const handleSimulatePreset = (presetText) => {
    setTranscript(presetText);
    setInterimTranscript('');
    handleProcessVoiceCommand(presetText);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '650px',
          width: '95%',
          background: 'var(--bg-secondary)',
          borderRadius: '22px',
          border: '1.5px solid var(--border-color)',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.45)',
          padding: '1.5rem',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #ef4444, #f97316)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
              }}
            >
              <Mic size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  {lang === 'bn' ? 'বাংলা স্মার্ট ভয়েস বিলিং সহকারী' : 'Bengali AI Voice Billing'}
                </h3>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: isListening ? 'rgba(239, 68, 68, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                    color: isListening ? '#ef4444' : 'var(--text-muted)',
                    border: isListening ? '1px solid #ef4444' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isListening ? '#ef4444' : '#64748b', animation: isListening ? 'pulse 1.5s infinite' : 'none' }} />
                  {isListening ? 'শুনছি...' : 'বন্ধ'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {lang === 'bn'
                  ? 'মুখে বলুন: "চাল", "প্রাণ চাল ১০ কেজি", "১ লিটার তেল", "১ ডজন ডিম"'
                  : 'Speak naturally: "Rice", "Pran Rice 10 kg", "1 Liter Oil"'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-icon"
            onClick={onClose}
            style={{ width: '34px', height: '34px', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Microphone Central Reactive Stage */}
        <div
          style={{
            textAlign: 'center',
            padding: '1.35rem 1rem',
            background: 'var(--bg-primary)',
            borderRadius: '18px',
            border: '1px solid var(--border-color)',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Animated Glow Rings when Listening */}
          {isListening && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                animation: 'pulse 1.8s infinite',
                pointerEvents: 'none'
              }}
            />
          )}

          {/* Big Mic Button */}
          <button
            type="button"
            onClick={toggleListening}
            style={{
              position: 'relative',
              width: '76px',
              height: '76px',
              borderRadius: '50%',
              background: isListening
                ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                : 'var(--bg-secondary)',
              color: isListening ? '#fff' : 'var(--text-muted)',
              border: isListening ? '3px solid rgba(255,255,255,0.4)' : '2px dashed var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              cursor: 'pointer',
              boxShadow: isListening ? '0 0 25px rgba(239, 68, 68, 0.5)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            title={isListening ? 'ভয়েস বন্ধ করতে চাপুন' : 'ভয়েস চালু করতে চাপুন'}
          >
            {isListening ? <Mic size={34} /> : <MicOff size={30} />}
          </button>

          {/* Current Live Transcription display */}
          <div style={{ minHeight: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {interimTranscript ? (
              <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f59e0b', fontStyle: 'italic' }}>
                "{interimTranscript}..."
              </div>
            ) : transcript ? (
              <div style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)' }}>
                🗣️ "{transcript}"
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isListening ? '🎤 স্পষ্ট কণ্ঠে পণ্যের নাম ও পরিমাণ বলুন...' : 'মাইক্রোফোনে চাপ দিয়ে কথা বলা শুরু করুন'}
              </div>
            )}
          </div>

          {/* Parsed Semantic Pills */}
          {parsedData && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
                পরিমাণ: {parsedData.quantity} {parsedData.unit || 'টি'}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '800', padding: '3px 10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1', border: '1px solid #6366f1' }}>
                পণ্য: {parsedData.productQuery || 'সকল'}
              </span>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* MULTI-TURN CANDIDATE SELECTION DISPLAY (E.G. USER SAID "চাল") */}
        {/* ============================================================== */}
        {dialogueState === 'awaiting_selection' && pendingCandidates.length > 0 && (
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '14px',
              borderRadius: '16px',
              background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.08), rgba(234, 88, 12, 0.03))',
              border: '1.5px solid rgba(249, 115, 22, 0.4)',
              boxShadow: '0 6px 22px rgba(249, 115, 22, 0.14)'
            }}
          >
            {/* Header & Cancel */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.25rem' }}>🌾</span>
                <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  "{pendingQuery || 'পণ্য'}" এর সকল বিকল্প ({pendingCandidates.length}টি পাওয়া গেছে)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCancelSelection}
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                ✕ বাতিল (Cancel)
              </button>
            </div>

            {/* Turn 2 Voice Prompt Banner */}
            <div
              style={{
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: '10px',
                padding: '9px 12px',
                marginBottom: '12px',
                fontSize: '0.8rem',
                color: '#ea580c',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Radio size={16} className="animate-pulse" style={{ color: '#ea580c', flexShrink: 0 }} />
              <span>
                👉 এখন মুখে পূর্ণ নাম ও পরিমাণ বলুন: <strong style={{ color: '#c2410c' }}>"প্রাণ চাল ১০ কেজি"</strong>, <strong style={{ color: '#c2410c' }}>"মিনিকেট ২৫ কেজি"</strong> অথবা নম্বর বলুন <strong style={{ color: '#c2410c' }}>"১ নম্বর"</strong>
              </span>
            </div>

            {/* Candidate Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              {pendingCandidates.map((cand, idx) => {
                const p = cand.product;
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => handleSelectCandidateByClick(cand)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: 'var(--bg-secondary)',
                      border: '1.5px solid var(--border-color)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#f97316';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(249, 115, 22, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: '800',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: '#f97316',
                          color: '#fff'
                        }}
                      >
                        {idx + 1} নম্বর
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        স্টক: {p.stock} {p.unit || 'টি'}
                      </span>
                    </div>

                    <div style={{ fontWeight: '800', fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '2px', lineHeight: '1.3' }}>
                      {p.name}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#10b981' }}>
                        ৳{p.sellPrice?.toLocaleString()} {p.unit ? `/ ${p.unit}` : ''}
                      </span>
                      <button
                        type="button"
                        style={{
                          background: 'rgba(249, 115, 22, 0.15)',
                          color: '#ea580c',
                          border: '1px solid rgba(249, 115, 22, 0.3)',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          fontSize: '0.72rem',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        + যোগ করুন
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Turn 2 Voice Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)' }}>
                ক্লিক করে টেস্ট বলুন:
              </span>
              {[
                'প্রাণ চাল ১০ কেজি',
                'মিনিকেট চাল ২৫ কেজি',
                'নাজিরশাইল ২০ কেজি',
                '১ নম্বর ৫ কেজি',
                '২ নম্বর ১০ কেজি'
              ].map((cmd, cIdx) => (
                <button
                  key={cIdx}
                  type="button"
                  onClick={() => handleSimulatePreset(cmd)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f97316'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                >
                  🗣️ "{cmd}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '1rem',
              fontSize: '0.82rem',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Continuous & Speech Settings Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-primary)',
            padding: '8px 12px',
            borderRadius: '10px',
            marginBottom: '1rem',
            fontSize: '0.78rem',
            border: '1px solid var(--border-color)'
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700', color: isContinuous ? '#10b981' : 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={isContinuous}
              onChange={(e) => setIsContinuous(e.target.checked)}
              style={{ accentColor: '#10b981' }}
            />
            <span>⚡ একটানা কথা বলা (Continuous Hands-Free)</span>
          </label>

          <button
            type="button"
            onClick={() => setSpeechFeedback(!speechFeedback)}
            style={{
              background: speechFeedback ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: speechFeedback ? '#10b981' : 'var(--text-muted)',
              border: 'none',
              borderRadius: '6px',
              padding: '4px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: '700'
            }}
          >
            {speechFeedback ? <Volume2 size={15} /> : <VolumeX size={15} />}
            <span>{speechFeedback ? 'ভয়েস উত্তর চালু' : 'নিঃশব্দ'}</span>
          </button>
        </div>

        {/* Recently Added Items via Voice */}
        {recentAddedList.length > 0 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              <span>{lang === 'bn' ? 'ভয়েসে কার্টে যুক্ত হওয়া পণ্যসমূহ:' : 'Recently Added via Voice:'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {recentAddedList.map(item => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    ✓ {item.quantity} {item.unit || 'টি'} {item.productName}
                  </div>
                  <div style={{ color: '#10b981', fontWeight: '800' }}>
                    ৳{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Clickable Voice Presets / Simulation for Rapid Testing */}
        <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: '800', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase' }}>
            <Sparkles size={14} style={{ color: '#f59e0b' }} />
            <span>{lang === 'bn' ? 'নমুনা ভয়েস কমান্ড (ক্লিক করে টেস্ট করুন):' : 'Sample Voice Commands (Click to Test):'}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '6px' }}>
            {[
              'চাল',
              'প্রাণ চাল ১০ কেজি',
              'মিনিকেট চাল ২৫ কেজি',
              'দেড় কেজি মসুর ডাল',
              'আড়াই কেজি চিনি',
              'এক পোয়া রসুন',
              '১ মণ মিনিকেট চাল',
              '১ লিটার সরিষার তেল',
              'রূপচাঁদা তেল ৫ লিটার',
              'ফার্মের লাল ডিম ১ ডজন',
              '২ কেজি চিনি, ৩ লিটার তেল আর ১ কেজি ডাল',
              '১০ কেজি চাল এবং ১ ডজন ডিম'
            ].map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSimulatePreset(cmd)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  fontSize: '0.76rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--business-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <Mic size={12} style={{ color: '#f97316', flexShrink: 0 }} />
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  "{cmd}"
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

