import { createClient, RedisClientType } from "redis";
import dotenv from "dotenv";

dotenv.config();

/**
 * Redis Service for caching
 * Provides methods for working with Redis cache
 */
class RedisService {
  private client: RedisClientType;
  private isConnected: boolean = false;
  private readonly defaultTTL: number;

  constructor() {
    // Get Redis configuration from environment variables
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.defaultTTL = parseInt(process.env.REDIS_TTL || "3600", 10); // Default: 1 hour

    // Create Redis client
    this.client = createClient({
      url: redisUrl,
    });

    // Set up event handlers
    this.client.on("error", (err: unknown) => {
      console.error("Redis Client Error:", err);
      this.isConnected = false;
    });

    this.client.on("connect", () => {
      console.log("Redis Client Connected");
      this.isConnected = true;
    });

    this.client.on("reconnecting", () => {
      console.log("Redis Client Reconnecting");
      this.isConnected = false;
    });

    this.client.on("ready", () => {
      console.log("Redis Client Ready");
      this.isConnected = true;
    });

    // Connect to Redis
    this.connect();
  }

  /**
   * Connect to Redis
   */
  private async connect(): Promise<void> {
    if (!this.isConnected) {
      try {
        await this.client.connect();
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
      }
    }
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns Promise with the cached value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting key ${key} from Redis:`, error);
      return null;
    }
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (optional, defaults to REDIS_TTL env var)
   * @returns Promise with success status
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const ttlToUse = ttl || this.defaultTTL;
      await this.client.set(key, JSON.stringify(value), { EX: ttlToUse });
      return true;
    } catch (error) {
      console.error(`Error setting key ${key} in Redis:`, error);
      return false;
    }
  }

  /**
   * Delete a value from the cache
   * @param key Cache key
   * @returns Promise with success status
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Error deleting key ${key} from Redis:`, error);
      return false;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key Cache key
   * @returns Promise with boolean indicating if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Error checking if key ${key} exists in Redis:`, error);
      return false;
    }
  }

  /**
   * Increment a counter in Redis
   * @param key Cache key
   * @param increment Amount to increment (default: 1)
   * @returns Promise with the new value
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      return await this.client.incrBy(key, increment);
    } catch (error) {
      console.error(`Error incrementing key ${key} in Redis:`, error);
      return 0;
    }
  }

  /**
   * Flush all data from Redis
   * @returns Promise with success status
   */
  async flushAll(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.client.flushAll();
      return true;
    } catch (error) {
      console.error("Error flushing Redis:", error);
      return false;
    }
  }
}

// Create and export a singleton instance
const redisService = new RedisService();
export default redisService;
