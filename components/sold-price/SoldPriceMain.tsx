"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, TrendingUp, TrendingDown, Calendar, PoundSterling, Check, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { AddressInput } from "@/components/address-input";
import { SoldPriceTable } from "./SoldPriceTable";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getSoldPriceDataAction, type SoldPriceDataResult } from "@/actions/sold-price-actions";
import { type SoldPriceFilters as FilterType } from "@/utils/fetchSoldPrice";
import { type AddressSuggestion } from "@/actions/address-autocomplete-actions";

interface SoldPriceMainProps {
  className?: string;
}

export function SoldPriceMain({ className }: SoldPriceMainProps) {
  const [address, setAddress] = useState<string>("");
  
  const [originalData, setOriginalData] = useState<SoldPriceDataResult | null>(null);
  const [statisticsData, setStatisticsData] = useState<SoldPriceDataResult | null>(null);
  const [filteredTableData, setFilteredTableData] = useState<SoldPriceDataResult | null>(null);
  const [tableFilters, setTableFilters] = useState<FilterType>({}); // Filters that only affect table view
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<string[]>([]);
  const [selectedEstateTypes, setSelectedEstateTypes] = useState<string[]>([]);
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [showCustomDateRange, setShowCustomDateRange] = useState(false);
  const [selectedPropertyTypeForStats, setSelectedPropertyTypeForStats] = useState<string>("all");
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
  const [groupPropertySales, setGroupPropertySales] = useState(true);

  // Apply filters to data client-side for dynamic filtering
  const applyFiltersToData = useCallback((data: SoldPriceDataResult, filters: FilterType): SoldPriceDataResult => {
    if (!filters || Object.keys(filters).length === 0) {
      return data;
    }

    let filteredTransactions = [...data.transactions];

    // Apply date filters
    if (filters.startDate) {
      filteredTransactions = filteredTransactions.filter(t => t.transactionDate >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredTransactions = filteredTransactions.filter(t => t.transactionDate <= filters.endDate!);
    }

    // Apply property type filter
    if (filters.propertyType) {
      filteredTransactions = filteredTransactions.filter(t => t.propertyType === filters.propertyType);
    }

    // Apply estate type filter
    if (filters.estateType) {
      filteredTransactions = filteredTransactions.filter(t => t.estateType === filters.estateType);
    }

    // Apply price range filters
    if (filters.minPrice) {
      filteredTransactions = filteredTransactions.filter(t => parseFloat(t.amount) >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filteredTransactions = filteredTransactions.filter(t => parseFloat(t.amount) <= filters.maxPrice!);
    }

    // Apply category filter
    if (filters.category) {
      filteredTransactions = filteredTransactions.filter(t => t.category === filters.category);
    }

    // Recalculate summary for filtered data
    if (filteredTransactions.length === 0) {
      return {
        ...data,
        transactions: [],
        summary: {
          ...data.summary,
          totalTransactions: 0,
          averagePrice: 0,
          medianPrice: 0,
          priceRange: { min: 0, max: 0 }
        }
      };
    }

    const prices = filteredTransactions.map(t => parseFloat(t.amount)).sort((a, b) => a - b);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    // Calculate date range for filtered data
    const dates = filteredTransactions.map(t => new Date(t.transactionDate)).sort((a, b) => a.getTime() - b.getTime());
    const oldestDate = dates[0].toISOString().split('T')[0];
    const mostRecentDate = dates[dates.length - 1].toISOString().split('T')[0];

    return {
      ...data,
      transactions: filteredTransactions,
      summary: {
        totalTransactions: filteredTransactions.length,
        averagePrice: Math.round(averagePrice),
        medianPrice: Math.round(medianPrice),
        priceRange: { min: minPrice, max: maxPrice },
        oldestDate,
        mostRecentDate
      },
      filters
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!address.trim()) {
      setError("Please enter a postcode or address");
      return;
    }

    setIsLoading(true);
    setError("");
    setOriginalData(null);
    setStatisticsData(null);
    setFilteredTableData(null);

    try {
      // Fetch all available data (no date filters for statistics)
      const result = await getSoldPriceDataAction(address.trim(), {});
      
      if (result.isSuccess && result.data) {
        setOriginalData(result.data);
        setStatisticsData(result.data); // Statistics use all data
        setFilteredTableData(result.data); // Table starts with all data
        setError("");
      } else {
        setError(result.message);
        setOriginalData(null);
        setStatisticsData(null);
        setFilteredTableData(null);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An unexpected error occurred. Please try again.");
      setOriginalData(null);
      setStatisticsData(null);
      setFilteredTableData(null);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  const handleAddressChange = useCallback((newAddress: string) => {
    setAddress(newAddress);
    // Clear data when address changes
    setOriginalData(null);
    setStatisticsData(null);
    setFilteredTableData(null);
  }, []);

  const handleAddressSelect = useCallback((suggestion: AddressSuggestion) => {
    setAddress(suggestion.place_name);
    // Clear data when address changes
    setOriginalData(null);
    setStatisticsData(null);
    setFilteredTableData(null);
  }, []);

  const handleTableFiltersChange = useCallback((newFilters: FilterType) => {
    setTableFilters(newFilters);
    // Apply filters to existing data if we have it (only affects table view)
    if (originalData) {
      const filtered = applyFiltersToData(originalData, newFilters);
      setFilteredTableData(filtered);
    }
  }, [originalData, applyFiltersToData]);

  // Handle year filter buttons (only affects table)
  const handleYearFilter = useCallback((years: number) => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - years);
    
    const newFilters: FilterType = {
      ...tableFilters,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    };
    
    setShowCustomDateRange(false);
    handleTableFiltersChange(newFilters);
  }, [tableFilters, handleTableFiltersChange]);

  // Helper to check if a year filter is active
  const isYearFilterActive = useCallback((years: number) => {
    if (!tableFilters.startDate || !tableFilters.endDate) return false;
    
    const end = new Date();
    const expectedStart = new Date();
    expectedStart.setFullYear(end.getFullYear() - years);
    
    const currentStart = new Date(tableFilters.startDate);
    const currentEnd = new Date(tableFilters.endDate);
    
    // Check if the dates match within a day (to account for timezone differences)
    const startDiff = Math.abs(currentStart.getTime() - expectedStart.getTime());
    const endDiff = Math.abs(currentEnd.getTime() - end.getTime());
    
    return startDiff < 24 * 60 * 60 * 1000 && endDiff < 24 * 60 * 60 * 1000;
  }, [tableFilters]);

  // Handle custom date range
  const handleCustomDateRange = useCallback(() => {
    if (customDateRange.start && customDateRange.end) {
      const newFilters: FilterType = {
        ...tableFilters,
        startDate: customDateRange.start,
        endDate: customDateRange.end
      };
      handleTableFiltersChange(newFilters);
    }
  }, [customDateRange, tableFilters, handleTableFiltersChange]);

  // Handle clearing all year filters
  const handleClearYearFilters = useCallback(() => {
    const newFilters: FilterType = {
      ...tableFilters,
      startDate: undefined,
      endDate: undefined
    };
    setShowCustomDateRange(false);
    setCustomDateRange({ start: '', end: '' });
    handleTableFiltersChange(newFilters);
  }, [tableFilters, handleTableFiltersChange]);

  // Handle property type checkbox
  const handlePropertyTypeToggle = useCallback((propertyType: string) => {
    const newSelectedTypes = selectedPropertyTypes.includes(propertyType)
      ? selectedPropertyTypes.filter(t => t !== propertyType)
      : [...selectedPropertyTypes, propertyType];
    
    setSelectedPropertyTypes(newSelectedTypes);
    
    const newFilters: FilterType = {
      ...tableFilters,
      propertyType: newSelectedTypes.length === 1 ? newSelectedTypes[0] as any : undefined
    };
    
    handleTableFiltersChange(newFilters);
  }, [selectedPropertyTypes, tableFilters, handleTableFiltersChange]);

  // Handle estate type checkbox
  const handleEstateTypeToggle = useCallback((estateType: string) => {
    const newSelectedTypes = selectedEstateTypes.includes(estateType)
      ? selectedEstateTypes.filter(t => t !== estateType)
      : [...selectedEstateTypes, estateType];
    
    setSelectedEstateTypes(newSelectedTypes);
    
    const newFilters: FilterType = {
      ...tableFilters,
      estateType: newSelectedTypes.length === 1 ? newSelectedTypes[0] as any : undefined
    };
    
    handleTableFiltersChange(newFilters);
  }, [selectedEstateTypes, tableFilters, handleTableFiltersChange]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleSearch();
    }
  }, [handleSearch, isLoading]);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate the selected period for dynamic text (default to 5 years for statistics)
  const getSelectedPeriodText = useMemo(() => {
    return "5 year period"; // Statistics always use 5-year period as default
  }, []);

  // Property type labels
  const propertyTypeLabels: Record<string, string> = {
    'D': 'Detached',
    'S': 'Semi-Detached', 
    'T': 'Terraced',
    'F': 'Flat/Maisonette',
    'O': 'Other'
  };

  // Calculate property type-specific statistics based on 5-year period
  const getPropertyTypeStats = useMemo(() => {
    if (!statisticsData || statisticsData.transactions.length === 0) {
      return { all: null, byType: {} };
    }

    // Filter transactions to last 5 years only
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    const fiveYearTransactions = statisticsData.transactions.filter(transaction => 
      new Date(transaction.transactionDate) >= fiveYearsAgo
    );

    if (fiveYearTransactions.length === 0) {
      return { all: null, byType: {} };
    }

    const stats: Record<string, any> = {};

    // Group transactions by property type
    const groupedByType = fiveYearTransactions.reduce((acc, transaction) => {
      const type = transaction.propertyType;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(transaction);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate stats for each property type
    Object.keys(groupedByType).forEach(type => {
      const typeTransactions = groupedByType[type];
      const prices = typeTransactions.map(t => parseFloat(t.amount)).sort((a, b) => a - b);
      
      if (prices.length > 0) {
        const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        const medianPrice = prices.length % 2 === 0 
          ? (prices[Math.floor(prices.length / 2) - 1] + prices[Math.floor(prices.length / 2)]) / 2
          : prices[Math.floor(prices.length / 2)];
        
        stats[type] = {
          count: prices.length,
          averagePrice: Math.round(averagePrice),
          medianPrice: Math.round(medianPrice),
          label: propertyTypeLabels[type] || type
        };
      }
    });

    // Calculate combined "All Properties" stats from all property types
    const allPrices = fiveYearTransactions.map(t => parseFloat(t.amount)).sort((a, b) => a - b);
    const allAveragePrice = allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length;
    const allMedianPrice = allPrices.length % 2 === 0 
      ? (allPrices[Math.floor(allPrices.length / 2) - 1] + allPrices[Math.floor(allPrices.length / 2)]) / 2
      : allPrices[Math.floor(allPrices.length / 2)];

    // Find the property type with the most transactions
    const mostTransactionsType = Object.keys(stats).reduce((max, type) => {
      return stats[type].count > (stats[max]?.count || 0) ? type : max;
    }, '');

    return {
      all: {
        totalTransactions: fiveYearTransactions.length,
        averagePrice: Math.round(allAveragePrice),
        medianPrice: Math.round(allMedianPrice),
        priceRange: { 
          min: Math.min(...allPrices), 
          max: Math.max(...allPrices) 
        }
      },
      byType: stats,
      mostTransactionsType
    };
  }, [statisticsData]);

  // Get current statistics based on selected property type
  const getCurrentStats = useMemo(() => {
    if (!getPropertyTypeStats.all) return null;
    
    if (selectedPropertyTypeForStats === "all") {
      return getPropertyTypeStats.all;
    } else {
      const typeStats = getPropertyTypeStats.byType[selectedPropertyTypeForStats];
      return typeStats ? {
        totalTransactions: typeStats.count,
        averagePrice: typeStats.averagePrice,
        medianPrice: typeStats.medianPrice,
        priceRange: getPropertyTypeStats.all.priceRange // Use overall price range
      } : null;
    }
  }, [getPropertyTypeStats, selectedPropertyTypeForStats]);

  // Calculate price trend percentage over 5-year period using filtered data
  const getPriceTrend = useMemo(() => {
    if (!statisticsData || statisticsData.transactions.length === 0) return null;

    // Filter to 5-year data first
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    
    const fiveYearTransactions = statisticsData.transactions.filter(transaction => 
      new Date(transaction.transactionDate) >= fiveYearsAgo
    );

    const transactions = selectedPropertyTypeForStats === "all" 
      ? fiveYearTransactions 
      : fiveYearTransactions.filter(t => t.propertyType === selectedPropertyTypeForStats);

    if (transactions.length < 2) return null;

    // Sort transactions by date
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    // Split into first half and second half of the 5-year period
    const now = new Date();
    const twoAndHalfYearsAgo = new Date();
    twoAndHalfYearsAgo.setFullYear(now.getFullYear() - 2.5);
    
    const earlierTransactions = sortedTransactions.filter(t => 
      new Date(t.transactionDate) < twoAndHalfYearsAgo
    );
    const recentTransactions = sortedTransactions.filter(t => 
      new Date(t.transactionDate) >= twoAndHalfYearsAgo
    );

    if (earlierTransactions.length === 0 || recentTransactions.length === 0) return null;

    // Calculate average prices for both periods
    const earlierAverage = earlierTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / earlierTransactions.length;
    const recentAverage = recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / recentTransactions.length;

    // Calculate percentage change
    const percentageChange = ((recentAverage - earlierAverage) / earlierAverage) * 100;

    return {
      percentage: percentageChange,
      isIncrease: percentageChange > 0,
      comparisonPeriod: 5
    };
  }, [statisticsData, selectedPropertyTypeForStats]);

  // Set default property type stats to the one with most transactions when data changes
  React.useEffect(() => {
    if (getPropertyTypeStats.mostTransactionsType && selectedPropertyTypeForStats === "all") {
      setSelectedPropertyTypeForStats(getPropertyTypeStats.mostTransactionsType);
    }
  }, [getPropertyTypeStats.mostTransactionsType, selectedPropertyTypeForStats]);

  // Extract and format full address from transaction data (excluding building numbers)
  const getFullAddress = useMemo(() => {
    if (!originalData || originalData.transactions.length === 0) return null;
    
    // Get the first transaction to extract address details
    const firstTransaction = originalData.transactions[0];
    const addressParts: string[] = [];
    
    // Add street (excluding building number)
    if (firstTransaction.street) {
      addressParts.push(firstTransaction.street);
    }
    
    // Add locality if available
    if (firstTransaction.locality && firstTransaction.locality !== firstTransaction.town) {
      addressParts.push(firstTransaction.locality);
    }
    
    // Add town
    if (firstTransaction.town) {
      addressParts.push(firstTransaction.town);
    }
    
    // Add district if available and different from town
    if (firstTransaction.district && firstTransaction.district !== firstTransaction.town) {
      addressParts.push(firstTransaction.district);
    }
    
    // Add county
    if (firstTransaction.county) {
      addressParts.push(firstTransaction.county);
    }
    
    // Add postcode
    if (firstTransaction.postcode) {
      addressParts.push(firstTransaction.postcode);
    }
    
    return addressParts.join(', ');
  }, [originalData]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Section */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Search className="h-5 w-5" />
            Property Sold Price Search
          </CardTitle>
          <CardDescription>
            Search for recent property sales in any UK area. Get insights into local market trends and price data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4 flex flex-col items-center">
            <div className="space-y-2 w-full max-w-md">
              <label htmlFor="address-input" className="text-sm font-medium block text-center">
                Postcode or Address
              </label>
              <AddressInput
                value={address}
                onChange={handleAddressChange}
                onAddressSelect={handleAddressSelect}
                placeholder="e.g., SW1A 1AA or London"
                className="w-full"
              />
            </div>

            <Button 
              onClick={handleSearch}
              disabled={isLoading || !address.trim()}
              className="w-full max-w-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Sold Prices
                </>
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {statisticsData && (
        <div className="space-y-8">
          {/* Address Section */}
          {getFullAddress && (
            <div className="text-center py-6">
              <div className="space-y-3">
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white border-2 border-black rounded-xl p-4 shadow-sm">
                    <div className="text-lg font-bold text-black">
                      {getFullAddress}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Statistics Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-2xl font-bold text-gray-900">Market Statistics</h2>
              <p className="text-muted-foreground mt-1">
                Overall property market data and trends for this area
              </p>
            </div>

            {/* Property Type Buttons */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Label className="text-sm font-medium">View statistics for:</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(getPropertyTypeStats.byType).map(([type, stats]) => (
                    <Button
                      key={type}
                      variant={selectedPropertyTypeForStats === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPropertyTypeForStats(type)}
                    >
                      {(stats as any).label} ({(stats as any).count})
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Sales</p>
                      <p className="text-2xl font-bold">{getCurrentStats?.totalTransactions || 0}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">Average Price</p>
                      <div className="flex items-center gap-2">
                        <p className="text-2xl font-bold">{formatPrice(getCurrentStats?.averagePrice || 0)}</p>
                        {getPriceTrend && (
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium ${
                            getPriceTrend.isIncrease 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {getPriceTrend.isIncrease ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {Math.abs(getPriceTrend.percentage).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Based on {getSelectedPeriodText}</p>
                      {getPriceTrend && (
                        <p className="text-xs text-muted-foreground">
                          {getPriceTrend.isIncrease ? 'Increase' : 'Decrease'} over period
                        </p>
                      )}
                      {selectedPropertyTypeForStats !== "all" && (
                        <p className="text-xs text-blue-600 mt-1">
                          ({propertyTypeLabels[selectedPropertyTypeForStats]} only)
                        </p>
                      )}
                    </div>
                    <div className={`h-8 w-8 ${getPriceTrend?.isIncrease ? 'text-green-600' : getPriceTrend ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {getPriceTrend?.isIncrease ? (
                        <TrendingUp className="h-8 w-8" />
                      ) : getPriceTrend ? (
                        <TrendingDown className="h-8 w-8" />
                      ) : (
                        <TrendingUp className="h-8 w-8" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Median Price</p>
                      <p className="text-2xl font-bold">{formatPrice(getCurrentStats?.medianPrice || 0)}</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on {getSelectedPeriodText}</p>
                      {selectedPropertyTypeForStats !== "all" && (
                        <p className="text-xs text-blue-600 mt-1">
                          ({propertyTypeLabels[selectedPropertyTypeForStats]} only)
                        </p>
                      )}
                    </div>
                    <PoundSterling className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Price Range</p>
                      <div className="space-y-1">
                        <p className="text-lg font-semibold">{formatPrice(getCurrentStats?.priceRange?.min || 0)}</p>
                        <p className="text-lg font-semibold">{formatPrice(getCurrentStats?.priceRange?.max || 0)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Based on {getSelectedPeriodText}</p>
                    </div>
                    <TrendingDown className="h-8 w-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Property Sales Section */}
          <div className="space-y-6">
            <div className="border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Property Sales</h2>
                <p className="text-muted-foreground mt-1">
                  Individual property transactions in this area (use filters to refine results)
                </p>
              </div>
            </div>

            {/* Filter Section */}
            <Collapsible open={!isFiltersCollapsed} onOpenChange={(open) => setIsFiltersCollapsed(!open)}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>Filters for Property Sales Table</span>
                  {isFiltersCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4">
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Group Property Sales Toggle */}
                    <TooltipProvider>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Table Display Options</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="group-sales"
                            checked={groupPropertySales}
                            onCheckedChange={setGroupPropertySales}
                          />
                          <Label htmlFor="group-sales" className="text-sm">
                            Group Property Sales
                          </Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="sm" className="p-1">
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>When enabled, multiple sales of the same property are grouped together in a single row</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    </TooltipProvider>

                    {/* Years Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Time Period</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearYearFilters}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={isYearFilterActive(1) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleYearFilter(1)}
                        >
                          1 Year
                        </Button>
                        <Button
                          variant={isYearFilterActive(5) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleYearFilter(5)}
                        >
                          5 Years
                        </Button>
                        <Button
                          variant={isYearFilterActive(10) ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleYearFilter(10)}
                        >
                          10 Years
                        </Button>
                        <Button
                          variant={showCustomDateRange ? "default" : "outline"}
                          size="sm"
                          onClick={() => setShowCustomDateRange(!showCustomDateRange)}
                        >
                          Custom Range
                        </Button>
                      </div>
                      
                      {/* Custom Date Range */}
                      {showCustomDateRange && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 p-3 border rounded-lg bg-gray-50">
                          <div className="space-y-2">
                            <Label htmlFor="custom-start" className="text-sm">From</Label>
                            <Input
                              id="custom-start"
                              type="date"
                              value={customDateRange.start}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-end" className="text-sm">To</Label>
                            <Input
                              id="custom-end"
                              type="date"
                              value={customDateRange.end}
                              onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                          </div>
                          <div className="flex items-end">
                            <Button
                              size="sm"
                              onClick={handleCustomDateRange}
                              disabled={!customDateRange.start || !customDateRange.end}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Property Type Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Property Type</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {[
                          { value: 'D', label: 'Detached' },
                          { value: 'S', label: 'Semi-Detached' },
                          { value: 'T', label: 'Terraced' },
                          { value: 'F', label: 'Flats/Maisonettes' },
                          { value: 'O', label: 'Other' }
                        ].map((type) => (
                          <Button
                            key={type.value}
                            variant={selectedPropertyTypes.includes(type.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePropertyTypeToggle(type.value)}
                            className="justify-start"
                          >
                            {selectedPropertyTypes.includes(type.value) && <Check className="w-4 h-4 mr-2" />}
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Estate Type Filter */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Estate Type</Label>
                      <div className="flex gap-2">
                        {[
                          { value: 'F', label: 'Freehold' },
                          { value: 'L', label: 'Leasehold' }
                        ].map((type) => (
                          <Button
                            key={type.value}
                            variant={selectedEstateTypes.includes(type.value) ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleEstateTypeToggle(type.value)}
                            className="justify-start"
                          >
                            {selectedEstateTypes.includes(type.value) && <Check className="w-4 h-4 mr-2" />}
                            {type.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>

            {/* Property Sales Table */}
            {filteredTableData && (
              <SoldPriceTable 
                transactions={filteredTableData.transactions} 
                groupSales={groupPropertySales}
              />
            )}
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredTableData && filteredTableData.transactions.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              No sold price data found for the specified location with current filters.
            </p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your search filters or using a different postcode.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}