import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hashedPassword: string) {
  return compare(password, hashedPassword);
}