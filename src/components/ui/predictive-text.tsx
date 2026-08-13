"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';

interface PredictiveInputProps {
  dictionary?: string[];
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (text: string) => void;
  onSearch?: (query: string) => void;
  className?: string;
  inputClassName?: string;
}

const DEFAULT_WORDS = [
  "Arduino", "Raspberry", "ESP32", "Robotics", "Drone", "Sensor",
  "Python", "Motor", "Bluetooth", "WiFi", "Camera", "OLED",
  "Kit", "Biped", "Quadcopter", "AI", "Electronics", "IoT", "3D Print"
];

export const PredictiveText: React.FC<PredictiveInputProps> = ({
  dictionary = DEFAULT_WORDS,
  placeholder = "Search...",
  value: propValue,
  onChange,
  onSend,
  onSearch,
  className = "",
  inputClassName = ""
}) => {
  const [internalText, setInternalText] = useState("");
  const isControlled = propValue !== undefined;
  const text = isControlled ? propValue : internalText;

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(-1);
  const [wordFrequency, setWordFrequency] = useState<Record<string, number>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const updateText = useCallback((val: string) => {
    if (!isControlled) {
      setInternalText(val);
    }
    onChange?.(val);
    onSearch?.(val);
  }, [isControlled, onChange, onSearch]);

  const enrichedDictionary = useCallback(() => {
    const freqWords = Object.keys(wordFrequency).sort(
      (a, b) => wordFrequency[b] - wordFrequency[a]
    );
    return Array.from(new Set([...freqWords, ...dictionary]));
  }, [dictionary, wordFrequency]);

  useEffect(() => {
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase();

    if (lastWord.length > 0) {
      const dict = enrichedDictionary();
      const matches = dict
        .filter(word => word.toLowerCase().startsWith(lastWord) && word.toLowerCase() !== lastWord)
        .slice(0, 3);

      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }

    setActiveSuggestionIndex(-1);
  }, [text, enrichedDictionary]);

  const applySuggestion = useCallback((suggestion: string) => {
    const words = text.split(/\s+/);
    words[words.length - 1] = suggestion;
    const newText = words.join(" ") + " ";
    updateText(newText);
    setActiveSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [text, updateText]);

  const handleSend = useCallback(() => {
    if (!text.trim()) return;

    const usedWords = text.trim().toLowerCase().split(/\s+/);
    setWordFrequency(prev => {
      const updated = { ...prev };
      usedWords.forEach(w => {
        updated[w] = (updated[w] ?? 0) + 1;
      });
      return updated;
    });

    onSend?.(text);
    onSearch?.(text);
    if (!isControlled) setInternalText("");
    setSuggestions([]);
  }, [text, onSend, onSearch, isControlled]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case "Enter": {
        if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
          e.preventDefault();
          applySuggestion(suggestions[activeSuggestionIndex]);
        } else {
          e.preventDefault();
          handleSend();
        }
        break;
      }

      case "Tab": {
        if (suggestions.length > 0) {
          e.preventDefault();
          const next = (activeSuggestionIndex + 1) % suggestions.length;
          setActiveSuggestionIndex(next);
        }
        break;
      }

      case "ArrowRight": {
        const input = inputRef.current;
        if (
          suggestions.length > 0 &&
          input &&
          input.selectionStart === text.length
        ) {
          e.preventDefault();
          applySuggestion(suggestions[0]);
        }
        break;
      }

      case "Escape": {
        if (suggestions.length > 0) {
          e.preventDefault();
          setSuggestions([]);
        } else if (text.length > 0) {
          e.preventDefault();
          updateText("");
        }
        break;
      }

      default:
        break;
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <AnimatePresence>
        {suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute left-0 top-full z-50 mt-1.5 flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/95 p-2 shadow-2xl backdrop-blur-xl"
          >
            {suggestions.map((word, i) => (
              <button
                key={word}
                type="button"
                onClick={() => applySuggestion(word)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap rounded-lg cursor-pointer
                  ${i === activeSuggestionIndex
                    ? 'bg-primary text-primary-foreground font-bold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}
                `}
              >
                {word}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex items-center w-full">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => updateText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`h-10 sm:h-11 w-full rounded-xl border border-border bg-card pl-10 pr-10 text-sm font-medium text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground ${inputClassName}`}
        />

        {text ? (
          <button
            type="button"
            onClick={() => updateText("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};