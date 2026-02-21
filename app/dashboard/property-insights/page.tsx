"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Home, TrendingUp, TrendingDown, PoundSterling, BarChart3, MapPin, Maximize, Train, Car, Bike, Clock, GraduationCap, Camera, Upload, Image as ImageIcon, Building2, Calendar } from "lucide-react";
import { getSoldPriceDataAction, type SoldPriceDataResult } from "@/actions/sold-price-actions";
import { getEPCByAddressAction, getEPCByPostcodeAction, type EPCSearchResult, type EPCCertificate } from "@/actions/epc-actions";
import { getTransportDataAction, getSchoolDataAction, type TransportData, type SchoolData } from "@/actions/transport-actions";
import { getEnergyRatingColor, getEnergyRatingColorWithBlackText, getEnergyRatingDescription } from "@/utils/epc-utils";

interface PropertyInsightsPageProps {}

export default function PropertyInsightsPage({}: PropertyInsightsPageProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [propertyData, setPropertyData] = useState<SoldPriceDataResult | null>(null);
  const [epcData, setEpcData] = useState<EPCSearchResult | null>(null);
  const [epcLoading, setEpcLoading] = useState(false);
  const [transportData, setTransportData] = useState<TransportData | null>(null);
  const [transportLoading, setTransportLoading] = useState(false);
  const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [isFloorAreaMetric, setIsFloorAreaMetric] = useState(true); // true = sqm, false = sqft
  const [isPricePerAreaMetric, setIsPricePerAreaMetric] = useState(true); // true = sqm, false = sqft

  // Unit conversion functions
  const convertSqmToSqft = (sqm: number): number => sqm * 10.7639;
  const formatFloorArea = (sqm: number | undefined): string => {
    if (!sqm) return 'Unknown';
    if (isFloorAreaMetric) {
      return `${sqm}m²`;
    } else {
      return `${Math.round(convertSqmToSqft(sqm))} ft²`;
    }
  };

  // Get latest transaction for price per area calculation
  const getLatestTransaction = () => {
    if (!propertyTransactions || propertyTransactions.length === 0) return null;
    return [...propertyTransactions].sort((a, b) => 
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )[0];
  };

  // Get efficiency color based on score (red/orange/green based on proximity to 100)
  const getEfficiencyColor = (score: number | undefined): string => {
    if (!score || score <= 0) return 'text-gray-400';
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  // Get address details from URL params
  const postcode = searchParams.get('postcode') || '';
  const street = searchParams.get('street') || '';
  const addressLine1 = searchParams.get('addressLine1') || '';
  const addressLine2 = searchParams.get('addressLine2') || '';
  const locality = searchParams.get('locality') || '';
  const town = searchParams.get('town') || '';
  const district = searchParams.get('district') || '';
  const county = searchParams.get('county') || '';

  // Format the full address
  const fullAddress = [addressLine1, addressLine2, street, locality, town, district, county, postcode]
    .filter(Boolean)
    .join(', ');

  const specificPropertyAddress = [addressLine1, addressLine2, street, postcode]
    .filter(Boolean)
    .join(', ');

  useEffect(() => {
    const fetchPropertyData = async () => {
      if (!postcode) {
        setError("No property information provided");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError("");

      try {
        // Fetch sold price data and EPC data in parallel
        const [soldPriceResult, epcResult] = await Promise.allSettled([
          getSoldPriceDataAction(postcode, {}),
          fetchEPCData()
        ]);
        
        // Handle sold price data
        if (soldPriceResult.status === 'fulfilled' && soldPriceResult.value.isSuccess && soldPriceResult.value.data) {
          setPropertyData(soldPriceResult.value.data);
        } else if (soldPriceResult.status === 'fulfilled') {
          setError(soldPriceResult.value.message || "Failed to load property data");
        }

        // Handle EPC data - don't let EPC errors prevent the page from loading
        if (epcResult.status === 'fulfilled' && epcResult.value.isSuccess && epcResult.value.data) {
          console.log('EPC data received in component:', epcResult.value.data);
          setEpcData(epcResult.value.data);
        } else if (epcResult.status === 'fulfilled') {
          console.log('EPC error:', epcResult.value.message);
        }
        
      } catch (err) {
        console.error("Property insights error:", err);
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    const fetchEPCData = async () => {
      setEpcLoading(true);
      try {
        // Try specific address first, then fallback to postcode
        const fullAddress = specificPropertyAddress || postcode;
        let result = await getEPCByAddressAction(fullAddress, 10);
        
        // If no results with address, try postcode only
        if (!result.isSuccess || (result.data && result.data.certificates.length === 0)) {
          result = await getEPCByPostcodeAction(postcode, 25);
        }
        
        return result;
      } catch (error) {
        console.warn("EPC fetch error:", error);
        return { isSuccess: false, message: "Failed to fetch EPC data" };
      } finally {
        setEpcLoading(false);
      }
    };

    const fetchTransportData = async () => {
      setTransportLoading(true);
      try {
        const result = await getTransportDataAction(postcode);
        if (result.isSuccess && result.data) {
          setTransportData(result.data);
        } else {
          console.log("Transport data fetch:", result.message);
        }
      } catch (err) {
        console.error("Transport data error:", err);
      } finally {
        setTransportLoading(false);
      }
    };

    const fetchSchoolData = async () => {
      setSchoolLoading(true);
      try {
        const result = await getSchoolDataAction(postcode);
        if (result.isSuccess && result.data) {
          setSchoolData(result.data);
        } else {
          console.log("School data fetch:", result.message);
        }
      } catch (err) {
        console.error("School data error:", err);
      } finally {
        setSchoolLoading(false);
      }
    };

    fetchPropertyData();
    fetchEPCData();
    fetchTransportData();
    fetchSchoolData();
  }, [postcode, specificPropertyAddress]);

  const handleGoBack = () => {
    router.back();
  };

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
      month: 'long',
      day: 'numeric'
    });
  };

  // Get property-specific transactions (same address)
  const propertyTransactions = propertyData?.transactions.filter(transaction => {
    const transactionAddress = [transaction.addressLine1, transaction.addressLine2, transaction.street]
      .filter(Boolean)
      .join(', ')
      .toLowerCase();
    
    const targetAddress = [addressLine1, addressLine2, street]
      .filter(Boolean)
      .join(', ')
      .toLowerCase();

    return transactionAddress === targetAddress;
  }) || [];

  // Get road-level transactions (same street)
  const streetTransactions = propertyData?.transactions.filter(transaction => 
    transaction.street?.toLowerCase() === street.toLowerCase() && transaction.postcode === postcode
  ) || [];

  // Calculate property value growth
  const getPropertyValueGrowth = () => {
    if (propertyTransactions.length < 2) return null;

    const sortedTransactions = [...propertyTransactions].sort((a, b) => 
      new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
    );

    const firstSale = sortedTransactions[0];
    const lastSale = sortedTransactions[sortedTransactions.length - 1];

    const growth = ((parseFloat(lastSale.amount) - parseFloat(firstSale.amount)) / parseFloat(firstSale.amount)) * 100;
    const years = (new Date(lastSale.transactionDate).getTime() - new Date(firstSale.transactionDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    return {
      growth: growth,
      annualizedGrowth: years > 0 ? growth / years : 0,
      firstSale,
      lastSale,
      years: Math.round(years * 10) / 10
    };
  };

  // Find most expensive property on the road
  const getMostExpensiveOnRoad = () => {
    if (streetTransactions.length === 0) return null;

    return streetTransactions.reduce((max, transaction) => 
      parseFloat(transaction.amount) > parseFloat(max.amount) ? transaction : max
    );
  };

  // Calculate property ranking on road
  const getPropertyRanking = () => {
    if (propertyTransactions.length === 0 || streetTransactions.length === 0) return null;

    const latestPropertyPrice = Math.max(...propertyTransactions.map(t => parseFloat(t.amount)));
    const streetPrices = streetTransactions.map(t => parseFloat(t.amount)).sort((a, b) => b - a);
    const ranking = streetPrices.findIndex(price => price <= latestPropertyPrice) + 1;

    return {
      ranking,
      totalProperties: new Set(streetTransactions.map(t => `${t.addressLine1}-${t.street}`)).size,
      percentile: Math.round((1 - (ranking - 1) / streetPrices.length) * 100)
    };
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading property insights...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 max-w-7xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sold Prices
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const valueGrowth = getPropertyValueGrowth();
  const mostExpensiveOnRoad = getMostExpensiveOnRoad();
  const propertyRanking = getPropertyRanking();

  // Find property-specific EPC with robust matching (normalise commas/whitespace, house-number fallback)
  const propertyEPCCert: EPCCertificate | null = (() => {
    if (!epcData || epcData.certificates.length === 0) return null;
    const certs = epcData.certificates;
    // Single result from an address-search → it's this property
    if (certs.length === 1) return certs[0];
    const norm = (s: string) => s.toLowerCase().replace(/[,\s]+/g, ' ').trim();
    const targetParts = [addressLine1, addressLine2].filter(Boolean);
    if (targetParts.length === 0) return certs[0];
    const targetNorm = norm(targetParts.join(' '));
    // Pass 1 — normalised partial match
    const match = certs.find(cert => {
      const certAddr = norm([cert.address1, cert.address2, cert.address3].filter(Boolean).join(' '));
      return certAddr.includes(targetNorm) || targetNorm.includes(certAddr);
    });
    if (match) return match;
    // Pass 2 — house number/name prefix match
    const houseNum = addressLine1.trim().split(/[\s,]+/)[0].toLowerCase();
    if (houseNum) {
      const numMatch = certs.find(cert => {
        const certAddr = norm(cert.address1 || '');
        return certAddr.startsWith(houseNum + ' ') || certAddr === houseNum;
      });
      if (numMatch) return numMatch;
    }
    return null;
  })();

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sold Prices
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Property Insights</h1>
            <div className="max-w-3xl">
              <div className="bg-white border-2 border-black rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-600" />
                  <span className="text-lg font-bold text-black">
                    {specificPropertyAddress || fullAddress}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Property Information Card */}
        {propertyEPCCert && (() => {
          const propertyEPC = propertyEPCCert;
          const propertyTypeLabel = propertyEPC.propertyType || '';
          const builtFormLabel = propertyEPC.builtForm || '';
          const propertyDescription = [builtFormLabel, propertyTypeLabel].filter(Boolean).join(' ');
          const latestTransaction = getLatestTransaction();
          const floorAreaSqm = propertyEPC.total_floor_area;
          const floorAreaSqft = floorAreaSqm ? convertSqmToSqft(floorAreaSqm) : 0;
          const latestPrice = latestTransaction ? parseFloat(latestTransaction.amount) : 0;
          const pricePerSqm = floorAreaSqm && latestPrice ? Math.round(latestPrice / floorAreaSqm) : 0;
          const pricePerSqft = floorAreaSqft && latestPrice ? Math.round(latestPrice / floorAreaSqft) : 0;
          const ageBand = propertyEPC.construction_age_band
            ? propertyEPC.construction_age_band.replace(/^England and Wales:\s*/i, '')
            : null;

          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Property Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">

                  {/* Property Type */}
                  {propertyDescription && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Home className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Property Type</p>
                      </div>
                      <p className="font-semibold text-gray-900">{propertyDescription}</p>
                    </div>
                  )}

                  {/* Floor Area */}
                  {floorAreaSqm > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Maximize className="h-4 w-4 text-blue-600" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Floor Area</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{formatFloorArea(floorAreaSqm)}</p>
                      <div className="flex items-center gap-1 pt-1">
                        <span className={`text-xs ${isFloorAreaMetric ? 'font-semibold text-gray-700' : 'text-muted-foreground'}`}>m²</span>
                        <Switch checked={!isFloorAreaMetric} onCheckedChange={(c) => setIsFloorAreaMetric(!c)} className="scale-75" />
                        <span className={`text-xs ${!isFloorAreaMetric ? 'font-semibold text-gray-700' : 'text-muted-foreground'}`}>ft²</span>
                      </div>
                    </div>
                  )}

                  {/* Price per m² */}
                  {latestTransaction && floorAreaSqm > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <PoundSterling className="h-4 w-4 text-green-600" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Price per {isPricePerAreaMetric ? 'm²' : 'ft²'}</p>
                      </div>
                      <p className="font-semibold text-green-600 text-lg">£{(isPricePerAreaMetric ? pricePerSqm : pricePerSqft).toLocaleString()}</p>
                      <div className="flex items-center gap-1 pt-1">
                        <span className={`text-xs ${isPricePerAreaMetric ? 'font-semibold text-gray-700' : 'text-muted-foreground'}`}>m²</span>
                        <Switch checked={!isPricePerAreaMetric} onCheckedChange={(c) => setIsPricePerAreaMetric(!c)} className="scale-75" />
                        <span className={`text-xs ${!isPricePerAreaMetric ? 'font-semibold text-gray-700' : 'text-muted-foreground'}`}>ft²</span>
                      </div>
                    </div>
                  )}

                  {/* Habitable Rooms */}
                  {propertyEPC.number_habitable_rooms > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Home className="h-4 w-4 text-purple-600" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Habitable Rooms</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-lg">{propertyEPC.number_habitable_rooms}</p>
                      <p className="text-xs text-muted-foreground">Proxy for bedrooms</p>
                    </div>
                  )}

                  {/* Construction Age Band */}
                  {ageBand && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Calendar className="h-4 w-4 text-amber-600" />
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">Built</p>
                      </div>
                      <p className="font-semibold text-gray-900">{ageBand}</p>
                      <p className="text-xs text-muted-foreground">Construction period</p>
                    </div>
                  )}

                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Property Value Growth Chart */}
        {propertyTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Property Value History
              </CardTitle>
              <CardDescription>
                Sales history and value progression for this specific property
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Property Transactions List */}
              <div className="space-y-4">
                {propertyTransactions
                  .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                  .map((transaction, index) => (
                    <div key={`${transaction.transactionDate}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold">{formatDate(transaction.transactionDate)}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">{transaction.propertyType === 'D' ? 'Detached' : 
                            transaction.propertyType === 'S' ? 'Semi-Detached' : 
                            transaction.propertyType === 'T' ? 'Terraced' : 
                            transaction.propertyType === 'F' ? 'Flat/Maisonette' : 'Other'}</Badge>
                          {transaction.estateType && (
                            <Badge variant="secondary">{transaction.estateType === 'F' ? 'Freehold' : 'Leasehold'}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">{formatPrice(parseFloat(transaction.amount))}</p>
                        {index === 0 && propertyTransactions.length > 1 && (
                          <p className="text-sm text-muted-foreground">Most Recent Sale</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Value Growth Summary */}
              {valueGrowth && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        {valueGrowth.growth > 0 ? (
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Total Growth</p>
                          <p className={`text-xl font-bold ${valueGrowth.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {valueGrowth.growth > 0 ? '+' : ''}{valueGrowth.growth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Annual Growth</p>
                          <p className="text-xl font-bold text-blue-600">
                            {valueGrowth.annualizedGrowth > 0 ? '+' : ''}{valueGrowth.annualizedGrowth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <PoundSterling className="h-5 w-5 text-purple-600" />
                        <div>
                          <p className="text-sm text-muted-foreground">Value Increase</p>
                          <p className="text-xl font-bold text-purple-600">
                            {formatPrice(parseFloat(valueGrowth.lastSale.amount) - parseFloat(valueGrowth.firstSale.amount))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Road Analysis */}
        {streetTransactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Street Analysis
              </CardTitle>
              <CardDescription>
                Comparative analysis with other properties on {street}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Property Ranking */}
                {propertyRanking && (
                  <Card>
                    <CardContent className="p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Property Ranking</p>
                        <p className="text-2xl font-bold">#{propertyRanking.ranking}</p>
                        <p className="text-xs text-muted-foreground">
                          Out of {propertyRanking.totalProperties} properties ({propertyRanking.percentile}th percentile)
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Most Expensive on Road */}
                {mostExpensiveOnRoad && (
                  <Card>
                    <CardContent className="p-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Highest Sale on Street</p>
                        <p className="text-2xl font-bold text-green-600">{formatPrice(parseFloat(mostExpensiveOnRoad.amount))}</p>
                        <p className="text-xs text-muted-foreground">
                          {mostExpensiveOnRoad.addressLine1} - {formatDate(mostExpensiveOnRoad.transactionDate)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Street Statistics */}
                <Card>
                  <CardContent className="p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Street Sales</p>
                      <p className="text-2xl font-bold">{streetTransactions.length}</p>
                      <p className="text-xs text-muted-foreground">
                        Total transactions recorded
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Street Average */}
              <Card>
                <CardContent className="p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Street Average Price</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {formatPrice(streetTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) / streetTransactions.length)}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on {streetTransactions.length} sales on {street}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {/* EPC Information */}
        {epcData && epcData.certificates.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Energy Performance Certificates (EPC)
              </CardTitle>
              <CardDescription>
                Energy efficiency ratings and environmental impact assessments for properties in this area
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Find property-specific EPC if available */}
              {(() => {
                const propertyEPC = propertyEPCCert;

                if (propertyEPC) {
                  return (
                    <div className="space-y-4">
                      <div className="p-6 rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-blue-800 shadow-xl border border-blue-500/20">
                        <h4 className="font-semibold text-white/80 mb-5 text-center text-xs uppercase tracking-widest">EPC Energy Rating</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                          {/* Current Rating */}
                          <div className="text-center space-y-2">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold shadow-lg ${getEnergyRatingColor(propertyEPC.currentEnergyRating || '')}`}>
                              {propertyEPC.currentEnergyRating || '?'}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">Current Rating</p>
                              <p className="text-xs text-blue-200/60 mt-0.5">{getEnergyRatingDescription(propertyEPC.currentEnergyRating || 'Unknown')}</p>
                            </div>
                          </div>
                          {/* Potential Rating */}
                          <div className="text-center space-y-2">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-xl text-2xl font-bold shadow-lg ${getEnergyRatingColor(propertyEPC.potentialEnergyRating || '')}`}>
                              {propertyEPC.potentialEnergyRating || '?'}
                            </div>
                            <div>
                              <p className="text-sm text-white font-medium">Potential Rating</p>
                              <p className="text-xs text-blue-200/60 mt-0.5">{getEnergyRatingDescription(propertyEPC.potentialEnergyRating || 'Unknown')}</p>
                            </div>
                          </div>
                          {/* Current Efficiency Score */}
                          <div className="text-center space-y-2">
                            <div className="w-16 h-16 mx-auto flex items-center justify-center">
                              <p className={`text-3xl font-bold ${getEfficiencyColor(propertyEPC.currentEnergyEfficiency)}`}>{propertyEPC.currentEnergyEfficiency || 'N/A'}</p>
                            </div>
                            <div>
                              {propertyEPC.currentEnergyEfficiency > 0 && (
                                <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${propertyEPC.currentEnergyEfficiency >= 80 ? 'bg-green-400' : propertyEPC.currentEnergyEfficiency >= 60 ? 'bg-yellow-400' : propertyEPC.currentEnergyEfficiency >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(propertyEPC.currentEnergyEfficiency, 100)}%` }}
                                  />
                                </div>
                              )}
                              <p className="text-sm text-white font-medium">Current Score</p>
                              <p className="text-xs text-blue-200/60 mt-0.5">Out of 100</p>
                            </div>
                          </div>
                          {/* Potential Efficiency Score */}
                          <div className="text-center space-y-2">
                            <div className="w-16 h-16 mx-auto flex items-center justify-center">
                              <p className={`text-3xl font-bold ${getEfficiencyColor(propertyEPC.potentialEnergyEfficiency)}`}>{propertyEPC.potentialEnergyEfficiency || 'N/A'}</p>
                            </div>
                            <div>
                              {propertyEPC.potentialEnergyEfficiency > 0 && (
                                <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                                  <div
                                    className={`h-1.5 rounded-full transition-all ${propertyEPC.potentialEnergyEfficiency >= 80 ? 'bg-green-400' : propertyEPC.potentialEnergyEfficiency >= 60 ? 'bg-yellow-400' : propertyEPC.potentialEnergyEfficiency >= 40 ? 'bg-orange-400' : 'bg-red-400'}`}
                                    style={{ width: `${Math.min(propertyEPC.potentialEnergyEfficiency, 100)}%` }}
                                  />
                                </div>
                              )}
                              <p className="text-sm text-white font-medium">Potential Score</p>
                              <p className="text-xs text-blue-200/60 mt-0.5">Out of 100</p>
                            </div>
                          </div>
                        </div>
                        {/* Inspection & Expiry Dates */}
                        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-center">
                          <div>
                            <p className="text-xs text-blue-200/50 uppercase tracking-wide mb-1">Inspection Date</p>
                            <p className="text-sm text-white font-medium">
                              {propertyEPC.lodgement_datetime
                                ? new Date(propertyEPC.lodgement_datetime).toLocaleDateString('en-GB')
                                : propertyEPC.inspectionDate
                                  ? new Date(propertyEPC.inspectionDate).toLocaleDateString('en-GB')
                                  : 'Unknown'}
                            </p>
                          </div>
                          <div>
                            {(() => {
                              const dateStr = propertyEPC.lodgement_datetime || propertyEPC.inspectionDate;
                              if (!dateStr) return <p className="text-sm text-white/60 font-medium">Unknown</p>;
                              const expiryDate = new Date(dateStr);
                              expiryDate.setFullYear(expiryDate.getFullYear() + 10);
                              const isExpired = new Date() > expiryDate;
                              return (
                                <>
                                  <p className="text-xs text-blue-200/50 uppercase tracking-wide mb-1">Expiry Date</p>
                                  <p className={`text-sm font-medium ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
                                    {expiryDate.toLocaleDateString('en-GB')}
                                  </p>
                                  {isExpired && <p className="text-xs text-red-400/80 mt-0.5">Certificate Expired</p>}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })()}

              {/* Area EPC Statistics */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Area EPC Overview</h4>
                <p className="text-sm text-gray-600">{epcData.certificates.length} EPC certificates found in this area</p>
                
                {(() => {
                  // Calculate EPC statistics for the area
                  console.log('EPC certificates for statistics:', epcData.certificates.length);
                  console.log('Sample certificate:', epcData.certificates[0]);
                  
                  const ratingCounts = epcData.certificates.reduce((acc, cert) => {
                    const rating = cert.currentEnergyRating;
                    console.log('Processing rating:', rating, 'for cert:', cert.lmkKey);
                    if (rating && rating.trim() !== '') {
                      acc[rating.toUpperCase()] = (acc[rating.toUpperCase()] || 0) + 1;
                    }
                    return acc;
                  }, {} as Record<string, number>);
                  
                  console.log('Rating counts:', ratingCounts);

                  const validEfficiencies = epcData.certificates.filter(cert => cert.currentEnergyEfficiency && cert.currentEnergyEfficiency > 0);
                  const avgEfficiency = validEfficiencies.length > 0 ? Math.round(
                    validEfficiencies.reduce((sum, cert) => sum + cert.currentEnergyEfficiency, 0) / 
                    validEfficiencies.length
                  ) : 0;

                  const mostCommonRating = Object.keys(ratingCounts).length > 0 ? 
                    Object.entries(ratingCounts).reduce((a, b) => 
                      ratingCounts[a[0]] > ratingCounts[b[0]] ? a : b
                    )[0] : 'Unknown';

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold ${getEnergyRatingColorWithBlackText(mostCommonRating)}`}>
                            {mostCommonRating}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">Most Common Rating</p>
                          <p className="text-xs text-gray-500">{ratingCounts[mostCommonRating]} properties</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-blue-600">{avgEfficiency}</p>
                          <p className="text-sm text-gray-600 mt-1">Area Average</p>
                          <p className="text-xs text-gray-500">Efficiency Score</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4 text-center">
                          <p className="text-2xl font-bold text-purple-600">{epcData.certificates.length}</p>
                          <p className="text-sm text-gray-600 mt-1">Total EPCs</p>
                          <p className="text-xs text-gray-500">In this area</p>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })()}

              </div>
            </CardContent>
          </Card>
        )}

        {/* EPC Loading State */}
        {epcLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Loading energy performance data...</p>
            </CardContent>
          </Card>
        )}

        {/* No EPC Data Message */}
        {epcData && epcData.certificates.length === 0 && !epcLoading && (
          <Card>
            <CardContent className="p-8 text-center">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No EPC Data Available</h3>
              <p className="text-muted-foreground">
                No Energy Performance Certificates found for this area. 
                EPC data may not be available for all properties.
              </p>
            </CardContent>
          </Card>
        )}

        {/* No Data Message */}
        {propertyTransactions.length === 0 && streetTransactions.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Limited Property Data</h3>
              <p className="text-muted-foreground">
                We couldn't find detailed transaction history for this specific property or street.
                This might be due to recent construction, limited sales activity, or data availability.
              </p>
            </CardContent>
          </Card>
        )}


        {/* Transport Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nearby Stations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Train className="h-5 w-5 text-blue-600" />
                Nearby Stations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transportLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-sm text-muted-foreground">Finding nearby stations...</p>
                </div>
              ) : transportData?.stations && transportData.stations.length > 0 ? (
                <div className="space-y-3">
                  {transportData.stations.map((station, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Train className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{station.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{station.type} Station</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">{station.distance} miles</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Train className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Stations Found</h3>
                  <p className="text-muted-foreground">
                    No nearby train stations found for this location.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Schools Modal */}
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                    Local Schools
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {schoolLoading ? (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-purple-600" />
                      <p className="text-sm text-muted-foreground">Finding schools...</p>
                    </div>
                  ) : schoolData && (schoolData.primary.length > 0 || schoolData.secondary.length > 0) ? (
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-purple-600">
                        {schoolData.primary.length + schoolData.secondary.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {schoolData.primary.length} Primary • {schoolData.secondary.length} Secondary
                      </p>
                      <p className="text-xs text-gray-500">Click to view details</p>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No schools found nearby</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Local Schools
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {schoolLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                    <p className="text-muted-foreground">Loading school information...</p>
                  </div>
                ) : schoolData ? (
                  <>
                    {/* Primary Schools */}
                    {schoolData.primary.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                          Primary Schools ({schoolData.primary.length})
                        </h4>
                        <div className="space-y-3">
                          {schoolData.primary.map((school, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{school.name}</p>
                                  <p className="text-xs text-gray-500">Primary School</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-blue-600">{school.distance} miles</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Secondary Schools */}
                    {schoolData.secondary.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                          Secondary Schools ({schoolData.secondary.length})
                        </h4>
                        <div className="space-y-3">
                          {schoolData.secondary.map((school, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                  <GraduationCap className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">{school.name}</p>
                                  <p className="text-xs text-gray-500">Secondary School</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">{school.distance} miles</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {schoolData.primary.length === 0 && schoolData.secondary.length === 0 && (
                      <div className="text-center py-8">
                        <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Schools Found</h3>
                        <p className="text-muted-foreground">
                          No local schools found in this area.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No School Data</h3>
                    <p className="text-muted-foreground">
                      School information not available for this location.
                    </p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Property Images Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-blue-600" />
              Property Images
            </CardTitle>
            <CardDescription>
              Property photos and listing images for {fullAddress}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Notice about legal property images */}
              <Alert>
                <ImageIcon className="h-4 w-4" />
                <AlertDescription>
                  Property images are sourced from legitimate APIs and user uploads. We respect copyright and do not scrape unauthorized content.
                </AlertDescription>
              </Alert>

              {/* Placeholder image gallery */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Placeholder images */}
                {[1, 2, 3].map((index) => (
                  <div key={index} className="relative aspect-video bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center group hover:bg-gray-50 transition-colors">
                    <div className="text-center">
                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-1">Property Image {index}</p>
                      <p className="text-xs text-gray-400">Coming Soon</p>
                    </div>
                    
                    {/* Future upload overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white rounded-full p-2 shadow-lg">
                        <Upload className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Future functionality notice */}
              <div className="bg-blue-50 rounded-lg p-4 mt-6">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Future Image Sources
                </h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>• Integration with legal property APIs (Zoopla, PrimeLocation)</p>
                  <p>• User-uploaded property photos</p>
                  <p>• Estate agent provided imagery</p>
                  <p>• Street view and satellite imagery</p>
                </div>
              </div>

              {/* Legal alternative suggestion */}
              <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-blue-50">
                <h4 className="font-medium text-gray-900 mb-2">✅ Recommended Legal Implementation</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Zoopla API:</strong> Provides property images, details, and pricing data legally</p>
                  <p><strong>User Upload:</strong> Allow property owners to add their own photos</p>
                  <p><strong>Google Street View:</strong> External property and neighborhood views</p>
                  <p><strong>Estate Agent Partnership:</strong> Direct access to listing photos</p>
                </div>
                <div className="mt-3 p-3 bg-white rounded border-l-4 border-yellow-400">
                  <p className="text-sm"><strong>Note:</strong> Scraping RightMove violates their Terms of Service and UK copyright law. The above alternatives provide legal access to property imagery.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}