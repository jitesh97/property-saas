"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, ArrowUp, ArrowDown, Home, Building, Calendar, PoundSterling } from "lucide-react";
import { SelectSoldPriceData } from "@/db/schema/sold-price-data-schema";

interface SoldPriceTableProps {
  transactions: Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>[];
  className?: string;
  groupSales?: boolean;
}

type SortField = 'amount' | 'transactionDate' | 'propertyType' | 'street';
type SortDirection = 'asc' | 'desc';

export function SoldPriceTable({ transactions, className, groupSales = true }: SoldPriceTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('transactionDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Property type labels
  const propertyTypeLabels: Record<string, string> = {
    'D': 'Detached',
    'S': 'Semi-Detached', 
    'T': 'Terraced',
    'F': 'Flat/Maisonette',
    'O': 'Other'
  };

  // Category labels
  const categoryLabels: Record<string, string> = {
    'A': 'Standard',
    'B': 'Additional'
  };

  // Estate type labels
  const estateTypeLabels: Record<string, string> = {
    'F': 'Freehold',
    'L': 'Leasehold'
  };

  // Group transactions by property (address + postcode)
  const groupedTransactions = useMemo(() => {
    if (!groupSales) {
      return transactions.map(transaction => ({
        key: `${transaction.postcode}-${transaction.transactionDate}-${Math.random()}`,
        transactions: [transaction],
        isGrouped: false
      }));
    }

    const grouped = transactions.reduce((groups, transaction) => {
      // Create a key based on address components that identify the same property
      const propertyKey = [
        transaction.addressLine1,
        transaction.addressLine2,
        transaction.street,
        transaction.postcode
      ].filter(Boolean).join('|').toLowerCase();

      if (!groups[propertyKey]) {
        groups[propertyKey] = [];
      }
      groups[propertyKey].push(transaction);
      return groups;
    }, {} as Record<string, typeof transactions>);

    return Object.entries(grouped).map(([key, groupTransactions]) => ({
      key,
      transactions: groupTransactions.sort((a, b) => 
        new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      ),
      isGrouped: groupTransactions.length > 1
    }));
  }, [transactions, groupSales]);

  // Sort grouped transactions
  const sortedGroupedTransactions = useMemo(() => {
    return [...groupedTransactions].sort((a, b) => {
      const transactionA = a.transactions[0]; // Use first transaction for sorting
      const transactionB = b.transactions[0];
      
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'amount':
          // For grouped, use the most recent transaction's price
          aValue = parseFloat(a.transactions[0].amount);
          bValue = parseFloat(b.transactions[0].amount);
          break;
        case 'transactionDate':
          aValue = new Date(transactionA.transactionDate);
          bValue = new Date(transactionB.transactionDate);
          break;
        case 'propertyType':
          aValue = propertyTypeLabels[transactionA.propertyType] || transactionA.propertyType;
          bValue = propertyTypeLabels[transactionB.propertyType] || transactionB.propertyType;
          break;
        case 'street':
          aValue = transactionA.street || '';
          bValue = transactionB.street || '';
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [groupedTransactions, sortField, sortDirection, propertyTypeLabels]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'transactionDate' ? 'desc' : 'asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleRowClick = (transaction: Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Navigate to property insights page with transaction data as query params
    const params = new URLSearchParams({
      postcode: transaction.postcode || '',
      street: transaction.street || '',
      addressLine1: transaction.addressLine1 || '',
      addressLine2: transaction.addressLine2 || '',
      locality: transaction.locality || '',
      town: transaction.town || '',
      district: transaction.district || '',
      county: transaction.county || '',
    });
    
    router.push(`/dashboard/property-insights?${params.toString()}`);
  };

  const formatPrice = (price: string): string => {
    const numPrice = parseFloat(price);
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      maximumFractionDigits: 0,
    }).format(numPrice);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAddress = (transaction: Omit<SelectSoldPriceData, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const parts = [
      transaction.addressLine1,
      transaction.addressLine2,
      transaction.street,
      transaction.locality
    ].filter(Boolean);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  const getPropertyIcon = (propertyType: string) => {
    switch (propertyType) {
      case 'D':
        return <Home className="h-4 w-4" />;
      case 'S':
      case 'T':
        return <Home className="h-4 w-4" />;
      case 'F':
        return <Building className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Property Sales
        </CardTitle>
        <CardDescription>
          {groupSales 
            ? `${sortedGroupedTransactions.length} propert${sortedGroupedTransactions.length !== 1 ? 'ies' : 'y'} with ${transactions.length} total transaction${transactions.length !== 1 ? 's' : ''}`
            : `${sortedGroupedTransactions.length} transaction${sortedGroupedTransactions.length !== 1 ? 's' : ''} found`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('transactionDate')}
                  >
                    Date
                    {getSortIcon('transactionDate')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('street')}
                  >
                    Address
                    {getSortIcon('street')}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('propertyType')}
                  >
                    Type
                    {getSortIcon('propertyType')}
                  </Button>
                </TableHead>
                <TableHead className="text-right">Details</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort('amount')}
                  >
                    Price
                    {getSortIcon('amount')}
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGroupedTransactions.map((group) => {
                const primaryTransaction = group.transactions[0]; // Most recent transaction
                const otherTransactions = group.transactions.slice(1); // Previous sales
                
                return (
                  <React.Fragment key={group.key}>
                    {/* Primary Row */}
                    <TableRow 
                      className={`cursor-pointer hover:bg-gray-50 ${group.isGrouped ? "border-b-0 border-l-4 border-l-blue-500 bg-blue-50/30" : ""}`}
                      onClick={() => handleRowClick(primaryTransaction)}
                    >
                      <TableCell className="font-medium">
                        {formatDate(primaryTransaction.transactionDate)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatAddress(primaryTransaction)}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <span>{primaryTransaction.postcode}</span>
                            {primaryTransaction.town && (
                              <>
                                <span>•</span>
                                <span>{primaryTransaction.town}</span>
                              </>
                            )}
                          </div>
                          {group.isGrouped && (
                            <Badge variant="secondary" className="text-xs">
                              {group.transactions.length} sales
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPropertyIcon(primaryTransaction.propertyType)}
                          <Badge variant="outline">
                            {propertyTypeLabels[primaryTransaction.propertyType] || primaryTransaction.propertyType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-1 justify-end">
                            {primaryTransaction.category && (
                              <Badge variant="secondary" className="text-xs">
                                {categoryLabels[primaryTransaction.category]}
                              </Badge>
                            )}
                            {primaryTransaction.estateType && (
                              <Badge variant="outline" className="text-xs">
                                {estateTypeLabels[primaryTransaction.estateType]}
                              </Badge>
                            )}
                            {primaryTransaction.newBuild === 'Y' && (
                              <Badge variant="default" className="text-xs">
                                New Build
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <PoundSterling className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-green-600">
                            {formatPrice(primaryTransaction.amount)}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                    
                    {/* Subrows for previous sales (only if grouped and has other transactions) */}
                    {group.isGrouped && otherTransactions.map((transaction, idx) => (
                      <TableRow 
                        key={`${group.key}-sub-${idx}`}
                        className="cursor-pointer hover:bg-gray-100 bg-gray-50/50 border-l-4 border-l-blue-200"
                        onClick={() => handleRowClick(transaction)}
                      >
                        <TableCell className="text-sm text-muted-foreground pl-8">
                          {formatDate(transaction.transactionDate)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <span className="italic">Previous Sale</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {/* Only show if different from primary */}
                          {transaction.propertyType !== primaryTransaction.propertyType && (
                            <div className="flex items-center gap-2">
                              {getPropertyIcon(transaction.propertyType)}
                              <Badge variant="outline" className="text-xs">
                                {propertyTypeLabels[transaction.propertyType] || transaction.propertyType}
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {/* Only show details if different from primary */}
                          {(transaction.category !== primaryTransaction.category || 
                            transaction.estateType !== primaryTransaction.estateType ||
                            transaction.newBuild !== primaryTransaction.newBuild) && (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {transaction.category && transaction.category !== primaryTransaction.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {categoryLabels[transaction.category]}
                                </Badge>
                              )}
                              {transaction.estateType && transaction.estateType !== primaryTransaction.estateType && (
                                <Badge variant="outline" className="text-xs">
                                  {estateTypeLabels[transaction.estateType]}
                                </Badge>
                              )}
                              {transaction.newBuild === 'Y' && primaryTransaction.newBuild !== 'Y' && (
                                <Badge variant="default" className="text-xs">
                                  New Build
                                </Badge>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PoundSterling className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-green-600 text-sm">
                              {formatPrice(transaction.amount)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination could be added here for large datasets */}
        {sortedGroupedTransactions.length > 50 && (
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Showing first {sortedGroupedTransactions.length} results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}