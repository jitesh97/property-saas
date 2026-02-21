"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Filter, X, Calendar, PoundSterling, Home } from "lucide-react";
import { type SoldPriceFilters as FilterType } from "@/utils/fetchSoldPrice";

interface SoldPriceFiltersProps {
  filters: FilterType;
  onFiltersChange: (filters: FilterType) => void;
  className?: string;
}

export function SoldPriceFilters({ 
  filters, 
  onFiltersChange, 
  className 
}: SoldPriceFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterType>(filters);

  // Property type options
  const propertyTypes = [
    { value: 'D', label: 'Detached' },
    { value: 'S', label: 'Semi-Detached' },
    { value: 'T', label: 'Terraced' },
    { value: 'F', label: 'Flats/Maisonettes' },
    { value: 'O', label: 'Other' }
  ];

  // Estate type options
  const estateTypes = [
    { value: 'F', label: 'Freehold' },
    { value: 'L', label: 'Leasehold' }
  ];

  // Category options
  const categories = [
    { value: 'A', label: 'Standard Price' },
    { value: 'B', label: 'Additional Price' }
  ];

  // Quick date range options (as per PRD requirements)
  const quickDateRanges = [
    { 
      label: 'Past year', 
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 1);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Past 5 years', 
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 5);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'Past 10 years', 
      getValue: () => {
        const end = new Date();
        const start = new Date();
        start.setFullYear(end.getFullYear() - 10);
        return {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        };
      }
    },
    { 
      label: 'All historical years', 
      getValue: () => {
        const end = new Date();
        return {
          startDate: '1995-01-01', // Land Registry PPD data starts from 1995
          endDate: end.toISOString().split('T')[0]
        };
      }
    }
  ];

  const handleLocalFilterChange = useCallback((key: keyof FilterType, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFiltersChange]);

  const handleClearFilters = useCallback(() => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  const handleQuickDateRange = useCallback((dateRange: { startDate: string; endDate: string }) => {
    setLocalFilters(prev => ({
      ...prev,
      ...dateRange
    }));
  }, []);

  const removeFilter = useCallback((key: keyof FilterType) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    setLocalFilters(newFilters);
  }, [filters, onFiltersChange]);

  // Count active filters
  const activeFilterCount = Object.keys(filters).length;

  // Format price display
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  // Get property type label
  const getPropertyTypeLabel = (value: string): string => {
    return propertyTypes.find(type => type.value === value)?.label || value;
  };

  // Get category label
  const getCategoryLabel = (value: string): string => {
    return categories.find(cat => cat.value === value)?.label || value;
  };

  // Get estate type label
  const getEstateTypeLabel = (value: string): string => {
    return estateTypes.find(type => type.value === value)?.label || value;
  };

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date Range Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date Range
                </Label>
                
                {/* Quick Date Range Buttons */}
                <div className="flex flex-wrap gap-2">
                  {quickDateRanges.map((range) => (
                    <Button
                      key={range.label}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickDateRange(range.getValue())}
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>

                {/* Custom Date Range */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="start-date" className="text-sm">From</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={localFilters.startDate || ''}
                      onChange={(e) => handleLocalFilterChange('startDate', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date" className="text-sm">To</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={localFilters.endDate || ''}
                      onChange={(e) => handleLocalFilterChange('endDate', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Property Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Property Type
                </Label>
                <Select
                  value={localFilters.propertyType || ''}
                  onValueChange={(value) => handleLocalFilterChange('propertyType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Estate Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Estate Type</Label>
                <Select
                  value={localFilters.estateType || ''}
                  onValueChange={(value) => handleLocalFilterChange('estateType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select estate type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Estate Types</SelectItem>
                    {estateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filters */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <PoundSterling className="h-4 w-4" />
                  Price Range
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="min-price" className="text-sm">Minimum Price</Label>
                    <Input
                      id="min-price"
                      type="number"
                      placeholder="e.g., 100000"
                      value={localFilters.minPrice || ''}
                      onChange={(e) => handleLocalFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-price" className="text-sm">Maximum Price</Label>
                    <Input
                      id="max-price"
                      type="number"
                      placeholder="e.g., 500000"
                      value={localFilters.maxPrice || ''}
                      onChange={(e) => handleLocalFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Category</Label>
                <Select
                  value={localFilters.category || ''}
                  onValueChange={(value) => handleLocalFilterChange('category', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleApplyFilters} className="flex-1">
                  Apply Filters
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {filters.startDate && filters.endDate && (
            <Badge variant="secondary" className="gap-1">
              {new Date(filters.startDate).toLocaleDateString()} - {new Date(filters.endDate).toLocaleDateString()}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  removeFilter('startDate');
                  removeFilter('endDate');
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.propertyType && (
            <Badge variant="secondary" className="gap-1">
              {getPropertyTypeLabel(filters.propertyType)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('propertyType')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.minPrice && (
            <Badge variant="secondary" className="gap-1">
              Min: {formatPrice(filters.minPrice)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('minPrice')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.maxPrice && (
            <Badge variant="secondary" className="gap-1">
              Max: {formatPrice(filters.maxPrice)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('maxPrice')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.estateType && (
            <Badge variant="secondary" className="gap-1">
              {getEstateTypeLabel(filters.estateType)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('estateType')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              {getCategoryLabel(filters.category)}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeFilter('category')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}