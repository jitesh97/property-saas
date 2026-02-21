"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { MapPin, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { AddressSuggestions } from "./AddressSuggestions";
import { getAddressSuggestionsAction, validateAddressAction, type AddressSuggestion } from "@/actions/address-autocomplete-actions";

interface AddressInputProps {
  value?: string;
  onChange?: (address: string) => void;
  onAddressSelect?: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export function AddressInput({
  value = "",
  onChange,
  onAddressSelect,
  placeholder = "Start typing your UK address...",
  className,
  disabled = false,
  required = false,
  error
}: AddressInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>("");
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced search function
  const debouncedSearch = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const result = await getAddressSuggestionsAction(query);
        if (result.isSuccess && result.data) {
          setSuggestions(result.data);
          setShowSuggestions(result.data.length > 0);
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300);
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    
    // Clear previous validation error
    setValidationError("");
    
    // Trigger debounced search
    debouncedSearch(newValue);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AddressSuggestion) => {
    setInputValue(suggestion.place_name);
    onChange?.(suggestion.place_name);
    onAddressSelect?.(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);

    // Validate the selected address
    setIsValidating(true);
    try {
      const result = await validateAddressAction(suggestion.place_name);
      if (!result.isSuccess) {
        setValidationError(result.message);
      }
    } catch (error) {
      console.error("Error validating address:", error);
      setValidationError("Failed to validate address");
    } finally {
      setIsValidating(false);
    }
  };

  // Handle clear input
  const handleClear = () => {
    setInputValue("");
    onChange?.("");
    setSuggestions([]);
    setShowSuggestions(false);
    setValidationError("");
    inputRef.current?.focus();
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value, inputValue]);

  const displayError = error || validationError;

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "pl-10 pr-10",
            displayError && "border-destructive focus-visible:ring-destructive",
            "transition-all duration-200"
          )}
          autoComplete="off"
        />

        {/* Loading spinner or clear button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading || isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : inputValue && !disabled ? (
            <button
              type="button"
              onClick={handleClear}
              className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear address"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <p className="mt-1 text-sm text-destructive">{displayError}</p>
      )}

      {/* Address suggestions */}
      {showSuggestions && !disabled && (
        <AddressSuggestions
          suggestions={suggestions}
          onSelect={handleSuggestionSelect}
          className="absolute top-full left-0 right-0 z-50 mt-1"
        />
      )}
    </div>
  );
}