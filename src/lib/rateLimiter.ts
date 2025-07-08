// Simple client-side rate limiter for API calls
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const requestTimes = this.requests.get(key)!;
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    if (recentRequests.length < this.maxRequests) {
      recentRequests.push(now);
      this.requests.set(key, recentRequests);
      return true;
    }

    return false;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return this.maxRequests;
    }

    const requestTimes = this.requests.get(key)!;
    const recentRequests = requestTimes.filter(time => time > windowStart);
    
    return Math.max(0, this.maxRequests - recentRequests.length);
  }

  getResetTime(key: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return now + this.windowMs;
    }

    const requestTimes = this.requests.get(key)!;
    const oldestRequest = Math.min(...requestTimes);
    
    return oldestRequest + this.windowMs;
  }

  clear(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

// Create rate limiters for different operations
export const authRateLimiter = new RateLimiter(5, 60000); // 5 auth attempts per minute
export const apiRateLimiter = new RateLimiter(100, 60000); // 100 API calls per minute
export const uploadRateLimiter = new RateLimiter(10, 300000); // 10 uploads per 5 minutes

// Rate limiting hook for React components
export function useRateLimit(limiter: RateLimiter, key: string) {
  const canMakeRequest = () => limiter.canMakeRequest(key);
  const getRemainingRequests = () => limiter.getRemainingRequests(key);
  const getResetTime = () => limiter.getResetTime(key);

  return {
    canMakeRequest,
    getRemainingRequests,
    getResetTime,
    limiter
  };
}

// Rate limiting wrapper for async functions
export function withRateLimit<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  limiter: RateLimiter,
  key: string
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    if (!limiter.canMakeRequest(key)) {
      const remaining = limiter.getRemainingRequests(key);
      const resetTime = limiter.getResetTime(key);
      const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
      
      throw new Error(
        `Rate limit exceeded. ${remaining} requests remaining. Try again in ${waitTime} seconds.`
      );
    }
    
    return fn(...args);
  };
} 