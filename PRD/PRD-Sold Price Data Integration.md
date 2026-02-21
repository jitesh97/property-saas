## Feature: Sold Price Data Integration

### Overview
This feature retrieves and displays historical sold price data for a given UK property or postcode. It provides transparency and market insight for users, allowing them to view recent sales in an area and compare them with local averages.

### User Stories & Requirements
- As a property seeker, I want to enter an address and see recent sold prices in that area, so that I can understand the property market better.
  - **Acceptance Criteria:**
    - User can input a valid UK address.
    - System retrieves and displays sold prices for that area.
    - Results are displayed in a user-friendly table or chart format.

- As a property seeker, I want to filter sold price data by date range and property type, so that I can refine my search.
  - **Acceptance Criteria:**
    - User can select a date range and property type from available filters.
    - System updates displayed results based on the selected filters.

### Technical Implementation

#### Database Schema
Provide the Drizzle ORM schema for the sold price data:

```typescript
// /db/schema/sold-price-data-schema.ts
export const soldPriceDataTable = pgTable('sold_price_data', {
  id: uuid('id').primaryKey().defaultRandom(),
  postcode: varchar('postcode', { length: 10 }).notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  propertyType: varchar('property_type', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

#### API Endpoints / Server Actions
List all server actions needed for this feature:

```typescript
// /actions/sold-price-actions.ts
import { fetchSoldPriceData } from '../utils/fetchSoldPrice';

export async function getSoldPriceData(postcode: string, startDate?: string, endDate?: string, propertyType?: string) {
  try {
    const results = await fetchSoldPriceData(postcode, startDate, endDate, propertyType);
    return results; // Return processed results for frontend usage.
  } catch (error) {
    console.error("Failed to fetch sold price data:", error);
    throw new Error("Could not retrieve sold price data");
  }
}
```

#### Components Structure
Describe the component hierarchy and key components:

```
/components/sold-price/
├── sold-price-main.tsx        // Main component to handle user input and display results
├── sold-price-table.tsx       // Component to render the table of sold prices
└── sold-price-filters.tsx     // Component for filtering options (date range and property type)
```

#### State Management
State for managing the sold price data will be handled using React's state hooks. The main component will maintain the state for the postcode, filtered data, and loading status. Server actions will be called to fetch data based on user inputs.

### Dependencies & Integrations
- **Interactions with Other Features:** The sold price data integration complements property search features, enhancing user experience by providing historical pricing insight. 
- **External APIs:** Integration with the UK Land Registry Price Paid Data API for retrieving historical sold price information.
- **Required npm Packages:** 
  - `axios` for making API requests.
  - `moment` for date management (if date filtering is implemented).

### Implementation Steps
1. Create the Supabase schema for sold price data.
2. Build the API route to query data from the Land Registry dataset.
3. Implement the `fetchSoldPriceData` function to call the Land Registry API and process results.
4. Develop the main UI component (`sold-price-main.tsx`) for user input and results display.
5. Create the table component (`sold-price-table.tsx`) to visualize the fetched data.
6. Implement the filters component (`sold-price-filters.tsx`) to allow users to filter results based on criteria.
7. Connect the frontend components to the backend server actions.
8. Add error handling and logging for reliability.
9. Conduct testing on different postcode inputs and filters.

### Edge Cases & Error Handling
- **Invalid Input:** If the user enters an invalid postcode, display an appropriate error message.
- **No Data Found:** If there are no sold price records for the given postcode, inform the user clearly.
- **API Failures:** Handle cases where the API may fail to respond or return an error, displaying a user-friendly message.

### Testing Approach
- **Unit Tests Needed:** 
  - Test the API action for fetching sold prices.
  - Validate input handling and error cases in components.
  
- **Integration Test Scenarios:** 
  - Full path test from user input submission to data retrieval and UI display.
  
- **User Acceptance Test Cases:** 
  - Confirm that valid postcodes return results and that filters update displayed results accordingly. 
  - Ensure that errors are displayed correctly to users.

By following this PRD, developers can implement the Sold Price Data Integration feature effectively and in alignment with project standards.