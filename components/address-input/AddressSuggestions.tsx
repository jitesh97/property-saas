"use client";

import React from "react";
import { MapPin, Building, Hash } from "lucide-react";
import { cn } from "@/lib/utils";
import { type AddressSuggestion } from "@/actions/address-autocomplete-actions";

interface AddressSuggestionsProps {
  suggestions: AddressSuggestion[];
  onSelect: (suggestion: AddressSuggestion) => void;
  className?: string;
}

export function AddressSuggestions({ 
  suggestions, 
  onSelect, 
  className 
}: AddressSuggestionsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "max-h-[300px] overflow-y-auto rounded-md border border-input bg-popover shadow-md",
        className
      )}
    >
      <div className="p-1">
        {suggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.place_name}-${index}`}
            type="button"
            onClick={() => onSelect(suggestion)}
            className={cn(
              "relative flex w-full cursor-default select-none items-start gap-3 rounded-sm px-3 py-2.5 text-left text-sm outline-none",
              "hover:bg-accent hover:text-accent-foreground",
              "focus:bg-accent focus:text-accent-foreground",
              "transition-colors duration-150"
            )}
          >
            {/* Icon */}
            <div className="mt-0.5 flex-shrink-0">
              {suggestion.type === 'postcode' ? (
                <Hash className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Building className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {/* Main text */}
              <div className="font-medium text-foreground truncate">
                {suggestion.text}
              </div>
              
              {/* Full address */}
              <div className="text-xs text-muted-foreground truncate mt-0.5">
                {suggestion.place_name}
              </div>

              {/* Context information */}
              {suggestion.context && suggestion.context.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground truncate">
                    {suggestion.context
                      .filter(ctx => ctx.text)
                      .map(ctx => ctx.text)
                      .join(", ")}
                  </span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Footer with suggestion count if many results */}
      {suggestions.length >= 10 && (
        <div className="border-t border-border bg-muted/50 px-3 py-2">
          <p className="text-xs text-muted-foreground text-center">
            Showing first 10 results. Type more to refine your search.
          </p>
        </div>
      )}
    </div>
  );
}