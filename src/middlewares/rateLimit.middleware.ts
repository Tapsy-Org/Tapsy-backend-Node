import rateLimit from 'express-rate-limit';

const createLimiter = (max: number, message: string, windowMs = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      status: 'fail',
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

export const followToggleLimiter = createLimiter(
  50,
  'Too many follow/unfollow requests from this IP.',
);
export const searchLimiter = createLimiter(100, 'Too many search requests from this IP.');
export const dataFetchLimiter = createLimiter(100, 'Too many requests from this IP.');
export const businessVideoLimiter = createLimiter(
  100,
  'Too many business video requests from this IP.',
);
export const likeToggleLimiter = createLimiter(100, 'Too many like/unlike requests from this IP.');
export const commentLimiter = createLimiter(30, 'Too many comment requests from this IP.');
export const reviewLimiter = createLimiter(20, 'Too many review requests from this IP.');
export const mutualFollowersLimiter = createLimiter(
  50,
  'Too many mutual follower requests from this IP.',
);
