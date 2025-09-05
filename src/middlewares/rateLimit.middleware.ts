import rateLimit from 'express-rate-limit';

// Rate limiter for follow/unfollow operations (more restrictive)
export const followToggleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 follow/unfollow requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many follow/unfollow requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for search operations
export const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 search requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many search requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general data fetching operations
export const dataFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for like/unlike operations
export const likeToggleLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 like/unlike requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many like/unlike requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for comment operations
export const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // limit each IP to 30 comment operations per windowMs
  message: {
    status: 'fail',
    message: 'Too many comment requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for review operations
export const reviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 review operations per windowMs
  message: {
    status: 'fail',
    message: 'Too many review requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for mutual followers (more restrictive due to complexity)
export const mutualFollowersLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 mutual follower requests per windowMs
  message: {
    status: 'fail',
    message: 'Too many mutual follower requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
