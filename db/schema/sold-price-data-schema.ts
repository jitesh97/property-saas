import { pgEnum, pgTable, varchar, decimal, date, timestamp, uuid, index } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Enums for property data
export const categoryEnum = pgEnum("category", ["A", "B"]);
export const propertyTypeEnum = pgEnum("property_type", ["D", "S", "T", "F", "O"]);
export const estateTypeEnum = pgEnum("estate_type", ["F", "L"]);
export const newBuildEnum = pgEnum("new_build", ["Y", "N"]);

export const soldPriceDataTable = pgTable("sold_price_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Property identifiers
  postcode: varchar("postcode", { length: 10 }).notNull(),
  addressLine1: varchar("address_line_1", { length: 200 }),
  addressLine2: varchar("address_line_2", { length: 200 }),
  street: varchar("street", { length: 200 }),
  locality: varchar("locality", { length: 200 }),
  town: varchar("town", { length: 200 }),
  district: varchar("district", { length: 200 }),
  county: varchar("county", { length: 200 }),
  
  // Transaction details
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  transactionDate: date("transaction_date").notNull(),
  transactionId: varchar("transaction_id", { length: 100 }),
  
  // Property characteristics  
  category: categoryEnum("category").notNull(), // A = Standard Price, B = Additional Price
  propertyType: propertyTypeEnum("property_type").notNull(), // D = Detached, S = Semi-Detached, T = Terraced, F = Flats/Maisonettes, O = Other
  estateType: estateTypeEnum("estate_type"), // F = Freehold, L = Leasehold
  newBuild: newBuildEnum("new_build"), // Y = New Build, N = Established Residential Building
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date())
}, (table) => {
  return {
    // Indexes for efficient querying
    postcodeIdx: index("sold_price_postcode_idx").on(table.postcode),
    transactionDateIdx: index("sold_price_transaction_date_idx").on(table.transactionDate),
    amountIdx: index("sold_price_amount_idx").on(table.amount),
    propertyTypeIdx: index("sold_price_property_type_idx").on(table.propertyType),
    categoryIdx: index("sold_price_category_idx").on(table.category),
    
    // Composite indexes for common queries
    postcodeTransactionDateIdx: index("sold_price_postcode_transaction_date_idx")
      .on(table.postcode, table.transactionDate),
    postcodePropertyTypeIdx: index("sold_price_postcode_property_type_idx")
      .on(table.postcode, table.propertyType),
      
    // Enable RLS on this table
    rls: sql`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`,
    
    // Allow all authenticated users to read sold price data
    readPolicy: sql`
      CREATE POLICY "All authenticated users can view sold price data" 
      ON ${table}
      FOR SELECT 
      USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
    `,
    
    // Only service role can insert/update/delete
    insertPolicy: sql`
      CREATE POLICY "Only service role can insert sold price data" 
      ON ${table}
      FOR INSERT 
      WITH CHECK (auth.role() = 'service_role');
    `,
    
    updatePolicy: sql`
      CREATE POLICY "Only service role can update sold price data" 
      ON ${table}
      FOR UPDATE
      USING (auth.role() = 'service_role');
    `,
    
    deletePolicy: sql`
      CREATE POLICY "Only service role can delete sold price data" 
      ON ${table}
      FOR DELETE
      USING (auth.role() = 'service_role');
    `,
  };
});

export type InsertSoldPriceData = typeof soldPriceDataTable.$inferInsert;
export type SelectSoldPriceData = typeof soldPriceDataTable.$inferSelect;