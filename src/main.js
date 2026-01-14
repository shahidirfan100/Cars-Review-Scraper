// Cars.com Review Scraper - CheerioCrawler implementation with HTTP-only approach
import { Actor, log } from 'apify';
import { CheerioCrawler, Dataset } from 'crawlee';

// Single-entrypoint main
await Actor.init();

async function main() {
    try {
        const input = (await Actor.getInput()) || {};
        const {
            startUrl,
            make = '',
            model = '',
            year,
            results_wanted: RESULTS_WANTED_RAW = 20,
            max_pages: MAX_PAGES_RAW = 10,
            proxyConfiguration,
        } = input;

        const RESULTS_WANTED = Number.isFinite(+RESULTS_WANTED_RAW) ? Math.max(1, +RESULTS_WANTED_RAW) : 20;
        const MAX_PAGES = Number.isFinite(+MAX_PAGES_RAW) ? Math.max(1, +MAX_PAGES_RAW) : 10;

        // Build Cars.com review URL
        const buildReviewUrl = (mk, mdl, yr, page = 1) => {
            const makeSlug = String(mk).toLowerCase().trim().replace(/\s+/g, '-');
            const modelSlug = String(mdl).toLowerCase().trim().replace(/\s+/g, '_');
            const yearNum = Number(yr);

            let url = `https://www.cars.com/research/${makeSlug}-${modelSlug}-${yearNum}/consumer-reviews/`;
            if (page > 1) {
                url += `?page=${page}`;
            }
            return url;
        };

        // Determine initial URL
        let initialUrl;
        if (startUrl) {
            initialUrl = startUrl;
        } else if (make && model && year) {
            initialUrl = buildReviewUrl(make, model, year, 1);
        } else {
            throw new Error('Either startUrl OR (make + model + year) must be provided');
        }

        // Extract car info from URL for output
        const extractCarInfo = (url) => {
            const match = url.match(/\/research\/([^-]+)-([^-]+)-(\d{4})\//);
            if (match) {
                return {
                    car_make: match[1].replace(/_/g, ' '),
                    car_model: match[2].replace(/_/g, ' '),
                    car_year: parseInt(match[3], 10),
                };
            }
            return { car_make: make || null, car_model: model || null, car_year: year || null };
        };

        const carInfo = extractCarInfo(initialUrl);

        const proxyConf = proxyConfiguration ? await Actor.createProxyConfiguration({ ...proxyConfiguration }) : undefined;

        let saved = 0;
        const seenUrls = new Set(); // Deduplication

        // Helper function to extract rating from element
        const extractRating = ($, element) => {
            const ratingAttr = $(element).attr('rating');
            if (ratingAttr) {
                const rating = parseFloat(ratingAttr);
                return !isNaN(rating) ? rating : null;
            }
            return null;
        };

        // Helper function to extract rating breakdown
        const extractRatingBreakdown = ($, container) => {
            const breakdown = {};
            const items = container.find('.review-breakdown--list li');

            items.each((_, item) => {
                const category = $(item).find('.label').text().trim().toLowerCase();
                const ratingEl = $(item).find('spark-rating');
                const rating = extractRating($, ratingEl);

                if (category && rating !== null) {
                    breakdown[category] = rating;
                }
            });

            return Object.keys(breakdown).length > 0 ? breakdown : null;
        };

        // Helper function for random delay (stealth)
        const randomDelay = (min = 500, max = 1500) => {
            return new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
        };

        const crawler = new CheerioCrawler({
            proxyConfiguration: proxyConf,
            maxRequestRetries: 3,
            useSessionPool: true,
            maxConcurrency: 3, // Reduced for stealth
            requestHandlerTimeoutSecs: 90,
            minConcurrency: 1,
            maxRequestsPerMinute: 60, // Rate limiting for stealth
            additionalMimeTypes: ['application/json'],
            // Enhanced headers for stealth
            preNavigationHooks: [
                async ({ request }, goToOptions) => {
                    // Add random delay between requests for stealth
                    await randomDelay(800, 2000);
                },
            ],
            async requestHandler({ request, $, log: crawlerLog }) {
                const pageNo = request.userData?.pageNo || 1;

                try {
                    crawlerLog.info(`Page ${pageNo}: Processing ${request.url}`);

                    // Find all review containers
                    const reviewContainers = $('.consumer-review-container');

                    if (reviewContainers.length === 0) {
                        crawlerLog.warning(`Page ${pageNo}: No reviews found`);
                        return;
                    }

                    crawlerLog.info(`Page ${pageNo}: Found ${reviewContainers.length} reviews`);

                    const reviews = [];

                    reviewContainers.each((_, container) => {
                        if (saved >= RESULTS_WANTED) return;

                        const $container = $(container);

                        // Extract review data
                        const title = $container.find('h3.title').text().trim() || null;

                        // Extract rating
                        const ratingEl = $container.find('spark-rating').first();
                        const rating = extractRating($, ratingEl);

                        // Extract date and author from review-byline
                        const bylineChildren = $container.find('.review-byline > div');
                        const date = bylineChildren.eq(0).text().trim() || null;
                        let author = bylineChildren.eq(1).text().trim() || null;

                        // Clean author text (remove "By " prefix if present)
                        if (author && author.startsWith('By ')) {
                            author = author.substring(3).trim();
                        }

                        // Extract review type
                        const reviewType = $container.find('.review-type').text().trim() || null;

                        // Extract review body
                        const reviewBody = $container.find('.review-body').text().trim() || null;

                        // Extract recommendation
                        const recommendation = $container.find('.review-recommendation strong').text().trim() || null;

                        // Extract rating breakdown
                        const ratingBreakdown = extractRatingBreakdown($, $container);

                        // Create review object
                        const review = {
                            title,
                            rating,
                            author,
                            date,
                            review_type: reviewType,
                            recommendation,
                            review_body: reviewBody,
                            rating_breakdown: ratingBreakdown,
                            car_make: carInfo.car_make,
                            car_model: carInfo.car_model,
                            car_year: carInfo.car_year,
                            url: request.url.split('?')[0], // Remove query params for cleaner URL
                        };

                        // Deduplicate by creating a unique key
                        const uniqueKey = `${author}|${date}|${title}`;
                        if (!seenUrls.has(uniqueKey)) {
                            seenUrls.add(uniqueKey);
                            reviews.push(review);
                            saved++;
                        }
                    });

                    // Push reviews in batch
                    if (reviews.length > 0) {
                        await Dataset.pushData(reviews);
                        crawlerLog.info(`✓ Saved ${reviews.length} reviews | Total: ${saved}/${RESULTS_WANTED}`);
                    }

                    // Handle pagination
                    if (saved < RESULTS_WANTED && pageNo < MAX_PAGES) {
                        try {
                            // Check if there's a next page link
                            const nextPageLink = $('.sds-pagination__next').attr('href');

                            if (nextPageLink) {
                                // Use the provided next page URL
                                const nextUrl = new URL(nextPageLink, request.url).href;
                                await crawler.addRequests([{
                                    url: nextUrl,
                                    userData: { pageNo: pageNo + 1 }
                                }]);
                                crawlerLog.info(`→ Enqueued page ${pageNo + 1}`);
                            } else if (reviewContainers.length >= 5) {
                                // Only try building next URL if we got a reasonable number of reviews
                                const baseUrl = request.url.split('?')[0];
                                const nextPage = pageNo + 1;
                                const nextUrl = `${baseUrl}?page=${nextPage}`;

                                await crawler.addRequests([{
                                    url: nextUrl,
                                    userData: { pageNo: nextPage }
                                }]);
                                crawlerLog.info(`→ Built URL for page ${nextPage}`);
                            } else {
                                crawlerLog.info(`No more pages available`);
                            }
                        } catch (paginationError) {
                            crawlerLog.warning(`Pagination error: ${paginationError.message}`);
                        }
                    } else {
                        crawlerLog.info(`Reached limit: ${saved} reviews collected`);
                    }
                } catch (error) {
                    crawlerLog.error(`Error processing page ${pageNo}: ${error.message}`);
                }
            },
        });

        await crawler.run([{ url: initialUrl, userData: { pageNo: 1 } }]);
        log.info(`✓ Scraping completed! Extracted ${saved} reviews from Cars.com`);
    } catch (error) {
        log.error(`Fatal error: ${error.message}`);
        throw error;
    } finally {
        await Actor.exit();
    }
}

main().catch(err => { console.error(err); process.exit(1); });
