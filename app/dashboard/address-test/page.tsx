"use client";

import React, { useState } from "react";
import { AddressInput, type AddressSuggestion } from "@/components/address-input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AddressTestPage() {
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<AddressSuggestion | null>(null);

  const handleAddressChange = (address: string) => {
    setSelectedAddress(address);
  };

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    setSelectedSuggestion(suggestion);
  };

  const handleReset = () => {
    setSelectedAddress("");
    setSelectedSuggestion(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Address Input Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the UK address autocomplete functionality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Address Input Component</CardTitle>
            <CardDescription>
              Start typing a UK address to see autocomplete suggestions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AddressInput
              value={selectedAddress}
              onChange={handleAddressChange}
              onAddressSelect={handleAddressSelect}
              placeholder="Enter a UK address..."
            />

            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {selectedAddress && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Selected Address
                <Badge variant="secondary">Current</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium">{selectedAddress}</p>
            </CardContent>
          </Card>
        )}

        {selectedSuggestion && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Selected Suggestion Details
                <Badge variant="default">API Response</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Text:</span>
                  <p className="font-medium">{selectedSuggestion.text}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Place Name:</span>
                  <p className="font-medium">{selectedSuggestion.place_name}</p>
                </div>
                {selectedSuggestion.context && selectedSuggestion.context.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Context:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSuggestion.context.map((ctx, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {ctx.id}: {ctx.text}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Features Implemented</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Debounced API calls (300ms)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">UK address autocomplete</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Address validation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Error handling</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Loading states</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Tailwind CSS styling</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Keyboard navigation</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">✓</Badge>
                <span className="text-sm">Clear functionality</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}