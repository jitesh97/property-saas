## Feature: Sold Price Data Integration Example

### Overview
In conjunction with PRD-Sold Price Data Integration.md document, please read this. I have already created another application which calls the Land Registry Price Paid Data API. However, I do not know if this is the best way to call the data or if it uses best practices, use your technical knowledge to evaluate and extract/query this data yourself. Rather than return random results, I want you to query this data and return me accurate results. Below is an example of what I had coded before.

from SPARQLWrapper import SPARQLWrapper, JSON
import pandas as pd
import re

endpoint_url = "https://landregistry.data.gov.uk/landregistry/query"

sparql_query_template = """
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX sr: <http://data.ordnancesurvey.co.uk/ontology/spatialrelations/>
PREFIX ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>
PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

SELECT ?paon ?saon ?street ?town ?county ?postcode ?amount ?date ?category ?propertyTypeLabel
WHERE
{
  VALUES ?postcode {"%s"^^xsd:string}

  ?addr lrcommon:postcode ?postcode.

  ?transx lrppi:propertyAddress ?addr ;
          lrppi:pricePaid ?amount ;
          lrppi:transactionDate ?date ;
          lrppi:transactionCategory/skos:prefLabel ?category;
          lrppi:propertyType ?propertyType.

  OPTIONAL {?addr lrcommon:county ?county}
  OPTIONAL {?addr lrcommon:paon ?paon}
  OPTIONAL {?addr lrcommon:saon ?saon}
  OPTIONAL {?addr lrcommon:street ?street}
  OPTIONAL {?addr lrcommon:town ?town}
  ?propertyType rdfs:label ?propertyTypeLabel.
}
ORDER BY ?amount
"""

def format_uk_postcode(postcode):
    postcode = postcode.replace(" ", "").upper()
    postcode_pattern = re.compile(
        r'^(GIR0AA|'
        r'([A-Z]{1,2}[0-9R][0-9A-Z]?)'
        r'([0-9][ABD-HJLNP-UW-Z]{2})'
        r')$'
    )
    match = postcode_pattern.match(postcode)
    if not match:
        raise ValueError("Invalid postcode format")
    outward = match.group(2)
    inward = match.group(3)
    formatted_postcode = f"{outward} {inward}"
    return formatted_postcode

def execute_sparql_query(postcode):
    try:
        formatted_postcode = format_uk_postcode(postcode)
    except ValueError as e:
        return str(e)
    sparql_query = sparql_query_template % formatted_postcode
    sparql = SPARQLWrapper(endpoint_url)
    sparql.setQuery(sparql_query)
    sparql.setReturnFormat(JSON)

    try:
        response = sparql.query().convert()
        return response['results']['bindings']
    except Exception as e:
        return str(e)

def process_results(results):
    if not results:
        return '[]'

    data = []
    for result in results:
        paon = result.get('paon', {}).get('value', 'N/A')
        saon = result.get('saon', {}).get('value', 'N/A')
        street = result.get('street', {}).get('value', 'N/A')
        town = result.get('town', {}).get('value', 'N/A')
        county = result.get('county', {}).get('value', 'N/A')
        postcode = result.get('postcode', {}).get('value', 'N/A')
        amount = result.get('amount', {}).get('value', 'N/A')
        date = result.get('date', {}).get('value', 'N/A')
        category = result.get('category', {}).get('value', 'N/A')
        propertyType = result.get('propertyTypeLabel', {}).get('value', 'N/A')

        data.append([paon, saon, street, town, county, postcode, amount, date, category, propertyType])

    df = pd.DataFrame(data, columns=['PAON', 'SAON', 'Street', 'Town', 'County', 'Postcode', 'Amount', 'Date', 'Category', 'PropertyType'])
    return df.to_json(orient='records')