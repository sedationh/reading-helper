import { useState, useEffect } from "react";

interface ReadingViewerProps {
  value: string;
}

const ReadingViewer = ({ value }: ReadingViewerProps) => {
  const [speakingParagraph, setSpeakingParagraph] = useState<number | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechSettings, setSpeechSettings] = useState({
    rate: 0.9,
    pitch: 1.0,
    volume: 1.0
  });
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const [startFromIndex, setStartFromIndex] = useState(0);

  useEffect(() => {
    const synth = window.speechSynthesis;
    setSpeechSynthesis(synth);
    
    // 获取可用的语音列表
    const loadVoices = () => {
      if (!synth) return;
      
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
      
      // 自动选择最佳语音 - 优先选择 Google US English
      const bestVoice = availableVoices.find(voice => 
        voice.name.includes('Google US English') && voice.lang === 'en-US'
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('zh') && voice.name.includes('Google')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('zh') && voice.name.includes('Enhanced')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('zh')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Google')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('en') && voice.name.includes('Enhanced')
      ) || availableVoices.find(voice => 
        voice.lang.startsWith('en')
      ) || availableVoices[0];
      
      setSelectedVoice(bestVoice);
    };

    // 语音列表可能需要时间加载
    if (synth && synth.getVoices().length === 0) {
      synth.addEventListener('voiceschanged', loadVoices);
      loadVoices();
    } else if (synth) {
      loadVoices();
    }

    return () => {
      if (synth) {
        synth.removeEventListener('voiceschanged', loadVoices);
      }
    };
  }, []);

  // 检测文本语言
  const detectLanguage = (text: string): string => {
    // 简单的语言检测：检查是否包含中文字符
    const hasChinese = /[\u4e00-\u9fff]/.test(text);
    return hasChinese ? 'zh-CN' : 'en-US';
  };

  const speakParagraph = (text: string, paragraphIndex: number, isSequential: boolean = false) => {
    if (!speechSynthesis || !window.speechSynthesis) return;

    // 停止当前朗读
    speechSynthesis.cancel();
    
    setSpeakingParagraph(paragraphIndex);
    setIsPaused(false);

    const utterance = new SpeechSynthesisUtterance(text);
    
    // 使用用户选择的语音，如果用户没有选择则自动选择最佳语音
    let voiceToUse = selectedVoice;
    
    if (!voiceToUse) {
      // 只有在用户没有选择语音时才自动选择 - 优先选择 Google US English
      const language = detectLanguage(text);
      if (language === 'zh-CN') {
        voiceToUse = voices.find(voice => 
          voice.lang.startsWith('zh') && voice.name.includes('Google')
        ) || voices.find(voice => 
          voice.lang.startsWith('zh') && voice.name.includes('Enhanced')
        ) || voices.find(voice => voice.lang.startsWith('zh')) || voices[0];
      } else {
        // 英文内容优先使用 Google US English
        voiceToUse = voices.find(voice => 
          voice.name.includes('Google US English') && voice.lang === 'en-US'
        ) || voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Google')
        ) || voices.find(voice => 
          voice.lang.startsWith('en') && voice.name.includes('Enhanced')
        ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      }
    }
    
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }
    
    // 使用用户设置的参数
    utterance.rate = speechSettings.rate;
    utterance.pitch = speechSettings.pitch;
    utterance.volume = speechSettings.volume;

    utterance.onend = () => {
      setSpeakingParagraph(null);
      
      // 如果是连续播放模式，继续播放下一个段落
      if (isSequential && paragraphIndex < paragraphs.length - 1) {
        setCurrentPlayIndex(paragraphIndex + 1);
        setTimeout(() => {
          speakParagraph(paragraphs[paragraphIndex + 1], paragraphIndex + 1, true);
        }, 500); // 段落间暂停500ms
      } else if (isSequential && paragraphIndex === paragraphs.length - 1) {
        // 播放完最后一个段落，停止连续播放
        setIsPlayingAll(false);
        setCurrentPlayIndex(0);
        setIsPaused(false);
      }
    };

    utterance.onerror = () => {
      setSpeakingParagraph(null);
      if (isSequential) {
        setIsPlayingAll(false);
        setCurrentPlayIndex(0);
        setIsPaused(false);
      }
    };

    speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesis && window.speechSynthesis) {
      speechSynthesis.cancel();
      setSpeakingParagraph(null);
      setIsPlayingAll(false);
      setCurrentPlayIndex(0);
      setIsPaused(false);
    }
  };

  const pauseSpeaking = () => {
    if (speechSynthesis && window.speechSynthesis) {
      speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeaking = () => {
    if (speechSynthesis && window.speechSynthesis) {
      speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const playAllParagraphs = (fromIndex?: number) => {
    if (isPlayingAll && !isPaused) {
      // 如果正在播放，则暂停
      pauseSpeaking();
    } else if (isPlayingAll && isPaused) {
      // 如果已暂停，则恢复播放
      resumeSpeaking();
    } else {
      // 开始播放所有段落
      if (paragraphs.length > 0) {
        const startIndex = fromIndex !== undefined ? fromIndex : startFromIndex;
        setStartFromIndex(startIndex); // 更新开始位置
        setIsPlayingAll(true);
        setCurrentPlayIndex(startIndex);
        setIsPaused(false);
        speakParagraph(paragraphs[startIndex], startIndex, true);
      }
    }
  };

  // 将 markdown 内容转换为段落数组
  const getParagraphs = (content: string): string[] => {
    // 简单地将内容按双换行符分割成段落
    const paragraphs = content
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    return paragraphs;
  };

  const paragraphs = getParagraphs(value);

  return (
    <div className="reading-viewer">
      <div className="reading-controls">
        <button 
          onClick={() => playAllParagraphs()}
          className={`play-all-button ${isPlayingAll ? 'playing' : ''} ${isPaused ? 'paused' : ''}`}
          disabled={paragraphs.length === 0}
        >
          {isPlayingAll && !isPaused ? "⏸️ Pause" : isPlayingAll && isPaused ? "▶️ Resume" : "▶️ Play All"}
        </button>
        <button 
          onClick={stopSpeaking}
          className="stop-button"
          disabled={speakingParagraph === null && !isPlayingAll}
        >
          {speakingParagraph !== null || isPlayingAll ? "Stop Reading" : "Stop"}
        </button>
        <button 
          onClick={() => {
            if (selectedVoice) {
              const testText = "Hello, this is Google US English voice test. The pronunciation is clear and natural. 你好，这是语音测试。";
              speakParagraph(testText, -1);
            }
          }}
          className="test-voice-button"
          disabled={!selectedVoice || voices.length === 0}
        >
          Test Voice
        </button>
      </div>
      
      <div className="voice-settings">
        <div className="setting-group">
          <label>Voice:</label>
          <select 
            value={selectedVoice?.name || ''} 
            onChange={(e) => {
              const voice = voices.find(v => v.name === e.target.value);
              setSelectedVoice(voice || null);
              console.log('Voice changed to:', voice?.name, voice?.lang);
            }}
            className="voice-select"
            disabled={voices.length === 0}
          >
            {voices.length === 0 ? (
              <option value="">Loading voices...</option>
            ) : (
              voices.map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name.includes('Google US English') ? '🏆 ' : voice.name.includes('Google') ? '⭐ ' : ''}{voice.name} ({voice.lang})
                </option>
              ))
            )}
          </select>
        </div>
        
        {selectedVoice && (
          <div className={`current-voice-info ${selectedVoice.name.includes('Google') ? 'google-voice' : ''} ${selectedVoice.name.includes('Google US English') ? 'premium-voice' : ''}`}>
            Current: {selectedVoice.name.includes('Google US English') ? '🏆 ' : selectedVoice.name.includes('Google') ? '⭐ ' : ''}{selectedVoice.name} ({selectedVoice.lang})
            {selectedVoice.name.includes('Google US English') && (
              <span className="premium-badge">Premium</span>
            )}
            {selectedVoice.name.includes('Google') && !selectedVoice.name.includes('Google US English') && (
              <span className="quality-badge">High Quality</span>
            )}
          </div>
        )}
        
        <div className="setting-group">
          <label>Speed:</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechSettings.rate}
            onChange={(e) => setSpeechSettings({
              ...speechSettings,
              rate: parseFloat(e.target.value)
            })}
            className="setting-slider"
          />
          <span className="setting-value">{speechSettings.rate.toFixed(1)}x</span>
        </div>
        
        <div className="setting-group">
          <label>Pitch:</label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={speechSettings.pitch}
            onChange={(e) => setSpeechSettings({
              ...speechSettings,
              pitch: parseFloat(e.target.value)
            })}
            className="setting-slider"
          />
          <span className="setting-value">{speechSettings.pitch.toFixed(1)}</span>
        </div>
        
        <div className="setting-group">
          <label>Volume:</label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={speechSettings.volume}
            onChange={(e) => setSpeechSettings({
              ...speechSettings,
              volume: parseFloat(e.target.value)
            })}
            className="setting-slider"
          />
          <span className="setting-value">{Math.round(speechSettings.volume * 100)}%</span>
        </div>
      </div>
      
      <div className="paragraphs-container">
        {paragraphs.map((paragraph, index) => (
          <div key={index} className="paragraph-with-buttons">
            <div className="paragraph-content">
              <p>{paragraph}</p>
            </div>
            <div className="paragraph-buttons notransition">
              <button
                onClick={() => speakParagraph(paragraph, index)}
                className={`read-button ${speakingParagraph === index ? 'speaking' : ''}`}
                disabled={speakingParagraph !== null && speakingParagraph !== index}
              >
                {speakingParagraph === index ? "Reading..." : "Read"}
              </button>
              <button
                onClick={() => playAllParagraphs(index)}
                className={`start-from-button ${isPlayingAll && currentPlayIndex === index ? 'current-playing' : ''} ${startFromIndex === index ? 'selected-start' : ''}`}
                disabled={isPlayingAll && currentPlayIndex === index}
              >
                {isPlayingAll && currentPlayIndex === index ? "Current" : startFromIndex === index ? "Start Here" : "Start From Here"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReadingViewer;