# Cars.com Review Scraper

Extract comprehensive consumer reviews and ratings from Cars.com for any vehicle make, model, and year. Get detailed insights into real owner experiences, ratings breakdowns, and recommendations to make informed automotive decisions.

## Why Choose This Scraper?

- **Fast & Efficient** - Optimized for speed with intelligent pagination handling
- **Comprehensive Data** - Extract review titles, ratings, author info, detailed feedback, and category-specific ratings
- **Easy Configuration** - Simple input parameters: just specify the car make, model, and year
- **Production Ready** - Built for reliability with automatic retries and error handling
- **Cost Effective** - Optimized resource usage for minimal compute costs

## What Data Can You Extract?

This scraper retrieves the following information from Cars.com consumer reviews:

- **Review Details**: Title, full review text, publication date
- **Ratings**: Overall star rating (1-5) and detailed category breakdowns
- **Author Information**: Reviewer name and verification status
- **Recommendations**: Whether the reviewer recommends the vehicle
- **Category Ratings**: Individual scores for comfort, interior, performance, value, exterior, and reliability
- **Vehicle Details**: Make, model, and year for every review

## Use Cases

### Automotive Research & Analysis
- Analyze consumer sentiment for specific vehicle models
- Compare ratings across different model years
- Track vehicle reliability trends over time

### Market Intelligence
- Monitor competitor vehicle reviews and ratings
- Identify common customer pain points and praise points
- Understand what features buyers value most

### Content Creation & Journalism
- Gather real owner feedback for automotive articles
- Compile comprehensive vehicle reviews from actual owners
- Research trending vehicles and consumer preferences

### Data Science & ML Projects
- Build sentiment analysis models on automotive reviews
- Create recommendation systems based on user feedback
- Analyze correlations between ratings and vehicle specifications

## Input Configuration

The scraper supports two configuration methods:

### Method 1: Direct URL (Recommended for Single Queries)

Provide a direct Cars.com review URL:

```json
{
  "startUrl": "https://www.cars.com/research/toyota-camry-2023/consumer-reviews/",
  "results_wanted": 50,
  "max_pages": 10
}
```

### Method 2: Make, Model, and Year (Recommended for Batch Queries)

Specify vehicle details to automatically build the URL:

```json
{
  "make": "honda",
  "model": "civic",
  "year": 2024,
  "results_wanted": 100,
  "max_pages": 15
}
```

### Input Parameters

| Parameter | Type | Required | Description | Default |
|-----------|------|----------|-------------|---------|
| `startUrl` | String | No* | Direct Cars.com review URL | - |
| `make` | String | No* | Vehicle manufacturer (e.g., "toyota", "ford") | - |
| `model` | String | No* | Vehicle model (e.g., "camry", "f-150") | - |
| `year` | Integer | No* | Model year (e.g., 2023, 2024) | - |
| `results_wanted` | Integer | No | Maximum number of reviews to extract | 20 |
| `max_pages` | Integer | No | Maximum pages to scrape (safety limit) | 10 |
| `proxyConfiguration` | Object | No | Proxy settings for requests | Residential proxies |

**Note:** Either provide `startUrl` OR the combination of `make`, `model`, and `year`.

## Output Format

Each review is returned as a structured JSON object:

```json
{
  "title": "Great family sedan with excellent reliability",
  "rating": 4.5,
  "author": "John Smith",
  "date": "January 10, 2024",
  "review_type": "Owns this car",
  "recommendation": "Recommends this car",
  "review_body": "I've owned this Camry for two years now and it has been incredibly reliable. The fuel economy is excellent and the interior is very comfortable for long drives...",
  "rating_breakdown": {
    "comfort": 5,
    "interior": 4,
    "performance": 4,
    "value": 5,
    "exterior": 4,
    "reliability": 5
  },
  "car_make": "toyota",
  "car_model": "camry",
  "car_year": 2023,
  "url": "https://www.cars.com/research/toyota-camry-2023/consumer-reviews/"
}
```

### Output Fields

- **`title`** - Headline or title of the review
- **`rating`** - Overall star rating (1-5 scale, may include decimals)
- **`author`** - Name of the reviewer
- **`date`** - When the review was published
- **`review_type`** - Verification status (e.g., "Owns this car", "Verified Purchaser")
- **`recommendation`** - Whether reviewer recommends the vehicle
- **`review_body`** - Full text content of the review
- **`rating_breakdown`** - Object containing individual category ratings (comfort, interior, performance, value, exterior, reliability)
- **`car_make`** - Vehicle manufacturer
- **`car_model`** - Vehicle model name
- **`car_year`** - Model year
- **`url`** - Source URL of the review page

## Examples

### Example 1: Extract Reviews for a Popular Sedan

```json
{
  "make": "toyota",
  "model": "camry",
  "year": 2023,
  "results_wanted": 50
}
```

### Example 2: Get Reviews for an Electric Vehicle

```json
{
  "make": "tesla",
  "model": "model_3",
  "year": 2024,
  "results_wanted": 100,
  "max_pages": 15
}
```

### Example 3: Research Luxury Vehicle Feedback

```json
{
  "make": "bmw",
  "model": "x5",
  "year": 2023,
  "results_wanted": 75
}
```

### Example 4: Using Direct URL

```json
{
  "startUrl": "https://www.cars.com/research/ford-f_150-2023/consumer-reviews/",
  "results_wanted": 200
}
```

## Performance & Cost Optimization

This scraper is optimized for both speed and cost efficiency:

- **Average Runtime**: 20 reviews in under 60 seconds
- **Proxy Usage**: Residential proxies recommended for best reliability
- **Concurrent Requests**: Balanced concurrency to avoid rate limiting
- **Memory Efficiency**: Streaming data processing for large extractions

### Tips for Optimization

1. **Set Realistic Limits**: Use `results_wanted` to control runtime and costs
2. **Batch Processing**: For multiple vehicles, run separate scraper instances
3. **Proxy Selection**: Residential proxies provide best success rates
4. **Page Limits**: Set `max_pages` as a safety cap to prevent runaway scraping

## Pagination & Data Collection

The scraper automatically handles pagination:

- Starts from page 1 of the review listing
- Continues to subsequent pages until reaching `results_wanted` or `max_pages`
- Intelligently detects when no more reviews are available
- Deduplicates reviews to ensure unique results

## Error Handling & Reliability

Built-in features ensure reliable data extraction:

- **Automatic Retries**: Failed requests are retried up to 3 times
- **Session Management**: Uses session pools to maintain consistent connections
- **Graceful Degradation**: Handles missing fields without crashing
- **Proxy Rotation**: Automatic proxy rotation to avoid blocking

## Best Practices

### For Accurate Data Collection
- Always verify the make/model/year combination exists on Cars.com
- Start with smaller `results_wanted` values for testing
- Monitor initial runs to ensure correct URL formatting

### For Large-Scale Scraping
- Break large jobs into smaller batches
- Use appropriate `max_pages` limits to prevent overruns
- Consider scraping during off-peak hours for better performance

### For Data Quality
- Review the first few results to ensure proper extraction
- Check that rating breakdowns are being captured correctly
- Validate that pagination is working as expected

## Frequently Asked Questions

**Q: How do I find the correct make/model format?**  
A: Visit Cars.com and navigate to the vehicle's review page. The URL format shows the exact make/model format needed (e.g., "toyota-camry", "ford-f_150").

**Q: What if a vehicle has no reviews?**  
A: The scraper will complete successfully but return an empty dataset. Always verify the vehicle has reviews on Cars.com before scraping.

**Q: Can I scrape reviews for multiple vehicles at once?**  
A: This scraper is designed for one vehicle at a time. For multiple vehicles, run separate scraper instances or use the Apify API to batch your requests.

**Q: How are rating breakdowns handled if they're missing?**  
A: The `rating_breakdown` field will be `null` if no category ratings are available for a specific review.

**Q: Is this scraper compliant with Cars.com's terms of service?**  
A: This scraper is designed to collect publicly available data. Always review and comply with Cars.com's terms of service and robots.txt directives.

## Support & Feedback

If you encounter any issues or have suggestions for improvements, please reach out through the Apify platform. We continuously update this scraper to ensure optimal performance and data accuracy.

## Version History

**v1.0.0** - Initial release
- Full review extraction with all metadata
- Pagination support
- Rating breakdown extraction
- Deduplication
- Production-ready reliability

---

**Keywords**: cars.com scraper, car reviews, vehicle reviews, consumer reviews, automotive data, car ratings, vehicle ratings, review scraper, Cars.com API, automotive intelligence, car research, vehicle feedback, owner reviews