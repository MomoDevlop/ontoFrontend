/**
 * Rate Limiter Service
 * 
 * This service helps prevent API rate limiting errors by managing request timing
 * and preventing too many simultaneous requests to the backend.
 */

interface RequestQueue {
  id: string;
  request: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class RateLimiter {
  private queue: RequestQueue[] = [];
  private isProcessing = false;
  private requestDelay = 200; // Delay between requests in milliseconds
  private maxConcurrent = 3; // Maximum concurrent requests
  private activeRequests = 0;

  /**
   * Add a request to the queue
   */
  async addRequest<T>(id: string, request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        request,
        resolve,
        reject,
      });
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0 || this.activeRequests >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const item = this.queue.shift();
      if (!item) break;

      this.activeRequests++;
      this.executeRequest(item);

      // Add delay between starting requests
      if (this.queue.length > 0) {
        await this.delay(this.requestDelay);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Execute a single request
   */
  private async executeRequest(item: RequestQueue) {
    try {
      console.log(`[RateLimiter] Executing request: ${item.id}`);
      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      console.error(`[RateLimiter] Request failed: ${item.id}`, error);
      item.reject(error);
    } finally {
      this.activeRequests--;
      // Continue processing queue after this request completes
      setTimeout(() => this.processQueue(), this.requestDelay / 2);
    }
  }

  /**
   * Add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the queue (useful for component unmounting)
   */
  clearQueue() {
    this.queue.forEach(item => {
      item.reject(new Error('Request cancelled'));
    });
    this.queue = [];
  }

  /**
   * Update rate limiting settings
   */
  updateSettings(settings: {
    requestDelay?: number;
    maxConcurrent?: number;
  }) {
    if (settings.requestDelay !== undefined) {
      this.requestDelay = settings.requestDelay;
    }
    if (settings.maxConcurrent !== undefined) {
      this.maxConcurrent = settings.maxConcurrent;
    }
  }
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Wrapper function to easily add requests to the rate limiter
 */
export const withRateLimit = <T>(id: string, request: () => Promise<T>): Promise<T> => {
  return rateLimiter.addRequest(id, request);
};

/**
 * Hook for React components to use rate limiter
 */
export const useRateLimit = () => {
  return {
    addRequest: rateLimiter.addRequest.bind(rateLimiter),
    getStatus: rateLimiter.getStatus.bind(rateLimiter),
    clearQueue: rateLimiter.clearQueue.bind(rateLimiter),
  };
};

export default rateLimiter;