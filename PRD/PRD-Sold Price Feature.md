## Feature: Sold Prices

### Overview
The sold price feature retrieves and displays historical sold price data for a given UK property or postcode. It provides transparency and market insight for users, allowing them to view recent sales in an area and compare them with local averages.

### Address

### Statistics

### Property Sales
The "Filters for Property Sales Table" does not collapse/show when I click the arrow.

### Property Insight
#### EPC
The font colour for the number of "Most Common Rating" is white, can you change it to black.

### Size

#### Price per sqm/sqft

#### Transport
The travel times seem to be inaccurate - is there a way to accurately depict what the travel time could be because this cannot be measured in a direct distance from station to property, it has to be calculated by available pathways a user would take via walking/cycling/driving. If not possible please tell me that it is not with a justification in the response. 

Similar to stations, I would like a modal for local schools, including primary and secondary. Subdivide these both in the same modal with the distance from property too.

#### RightMove Scrape
This is a totally different feature I want to show in the property insight. Now this may not work and I may want to remove the feature, so build it accordingly so that it can be undone.

I want you to build a scraper for RightMove, there is currently no public API available. We do not want a lot of information because we already have the information regarding to price, date, and type of property, all we want is the image of the property when listed.

For example this is how I would search for the property 174 Elm Park Avenue, RM12 4RY: 
1. https://www.rightmove.co.uk/house-prices/rm12-4ry.html
2. Find property 174 Elm Park Avenue
3. https://www.rightmove.co.uk/house-prices/details/e5a4971e-dfa4-4b48-bf4f-961c1ae87301 - extract images under the "Previously listed for sale on Rightmove:" and Date - when I copy the image address this is the format: https://media.rightmove.co.uk/10k/9291/45128608/9291_174ELMPARK_IMG_00_0000.JPG

In order to build this script, look at the most genius way, figure out patterns in the image address format, the most simple way to extract accurately.

When we look at the property insights, I want a section called "Image" with the images relating to the proprety in particular, with the latest photos being extracted from Rightmove Listings.

### Additional Enhancement
No unit tests to be written or tested for now.
