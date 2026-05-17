import { userRepository } from '../repositories/user.repository';
import { productRepository } from '../repositories/product.repository';
import { cartRepository } from '../repositories/cart.repository';
import { cassandraRepository } from '../repositories/cassandra.repository';

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
  return cassandraRepository.countAll();
}
