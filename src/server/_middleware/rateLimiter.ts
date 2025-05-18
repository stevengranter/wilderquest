import rateLimit from 'express-rate-limit'

// Limits per service:

// ** iNaturalist **
// (from https://api.inaturalist.org/v1/docs/)
// Please note that we throttle API usage to a max of
// * 100 requests per minute, though we ask that you,
// * try to keep it to 60 requests per minute or lower, and to keep
// * under 10,000 requests per day.
// If we notice usage that has serious impact on our performance
// we may institute blocks without notification.

// ** Pexels **
// (from https://www.pexels.com/api/documentation/)
//
// Do not abuse the API. By default, the API is rate-limited to
// * 200 requests per hour and
// * 20,000 requests per month.
// You may contact us to request a higher limit, but please include examples,
// or be prepared to give a demo, that clearly shows your use of the
// API with attribution. If you meet our API terms, you can get
// unlimited requests for free.
//
// Abuse of the Pexels API, including but not limited to attempting to work
// around the rate limit, will lead to termination of your API access.
//
// ** LocationIQ **
// (from https://locationiq.com/docs)
// How many concurrent requests you can send will depend on the per-second
// limit associated with your account.
// If on the free plan, this limit is 2/second.

const DEFAULT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const DEFAULT_MAX = 100 // limit each IP to 100 requests per windowMs

export const rateLimiter = (
    windowMs: number = DEFAULT_WINDOW_MS,
    max: number = DEFAULT_MAX) => rateLimit({
    windowMs,
    max,
})
