import { userRepository } from '../repositories/user.repository';
import { productRepository } from '../repositories/product.repository';
import { cartRepository } from '../repositories/cart.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';
import { pool } from '../config/postgres';
import mongoose from 'mongoose';
import { redis } from '../config/redis';
import { cassandra } from '../config/cassandra';

export async function getPostgresStats() {
  return userRepository.getPostgresStats();
}

export async function getMongoStats() {
  return productRepository.getMongoStats();
}

export async function getRedisStats() {
  return cartRepository.getRedisStats();
}

export async function getCassandraStats() {
  return cassandraRepository.getRecentActivity();
}

export async function getLatencyStats() {
  const getPostgres = async () => {
    const start = Date.now();
    try {
      await pool.query('SELECT 1');
      return Date.now() - start;
    } catch {
      return 999;
    }
  };

  const getMongo = async () => {
    const start = Date.now();
    try {
      const db = mongoose.connection.db;
      if (db) {
        await db.admin().ping();
        return Date.now() - start;
      }
      return 999;
    } catch {
      return 999;
    }
  };

  const getRedis = async () => {
    const start = Date.now();
    try {
      await redis.ping();
      return Date.now() - start;
    } catch {
      return 999;
    }
  };

  const getCassandra = async () => {
    const start = Date.now();
    try {
      await cassandra.execute('SELECT now() FROM system.local');
      return Date.now() - start;
    } catch {
      return 999;
    }
  };

  const [postgres, mongo, redisLat, cassandraLat] = await Promise.all([
    getPostgres(),
    getMongo(),
    getRedis(),
    getCassandra(),
  ]);

  return {
    postgres,
    mongo,
    redis: redisLat,
    cassandra: cassandraLat,
  };
}
