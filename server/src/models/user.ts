import { db } from "../db/knex";
import bcrypt from "bcrypt";
import crypto from "crypto";

export interface User {
  id: string;
  email: string;
  password: string;
  name?: string | null;
  reset_token?: string | null;
  reset_token_expiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name?: string;
}

export interface UpdateUserInput {
  name?: string;
  password?: string;
  reset_token?: string | null;
  reset_token_expiry?: Date | null;
}

const TABLE_NAME = "users";
const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_HOURS = 24;

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if user with this email already exists
  const existingUser = await getUserByEmail(input.email);
  if (existingUser) {
    throw new Error(`User with email ${input.email} already exists`);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Insert the new user
  const [user] = await db(TABLE_NAME)
    .insert({
      email: input.email.toLowerCase(),
      password: hashedPassword,
      name: input.name || null,
    })
    .returning("*");

  return user;
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  return db(TABLE_NAME).where({ id }).first();
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return db(TABLE_NAME).where({ email: email.toLowerCase() }).first();
}

/**
 * Update a user
 */
export async function updateUser(
  id: string,
  updates: UpdateUserInput
): Promise<User> {
  // If password is being updated, hash it
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
  }

  const [updatedUser] = await db(TABLE_NAME)
    .where({ id })
    .update(updates)
    .returning("*");

  return updatedUser;
}

/**
 * Validate a user's password
 */
export async function validatePassword(
  user: User,
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, user.password);
}

/**
 * Generate a password reset token for a user
 */
export async function generateResetToken(email: string): Promise<string | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString("hex");
  
  // Set token expiry (24 hours from now)
  const resetTokenExpiry = new Date();
  resetTokenExpiry.setHours(
    resetTokenExpiry.getHours() + RESET_TOKEN_EXPIRY_HOURS
  );

  // Update the user with the reset token
  await updateUser(user.id, {
    reset_token: resetToken,
    reset_token_expiry: resetTokenExpiry,
  });

  return resetToken;
}

/**
 * Validate a password reset token
 */
export async function validateResetToken(
  email: string,
  token: string
): Promise<User | null> {
  const user = await getUserByEmail(email);
  
  if (
    !user ||
    !user.reset_token ||
    !user.reset_token_expiry ||
    user.reset_token !== token ||
    new Date() > new Date(user.reset_token_expiry)
  ) {
    return null;
  }

  return user;
}

/**
 * Reset a user's password using a valid token
 */
export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<boolean> {
  const user = await validateResetToken(email, token);
  
  if (!user) {
    return false;
  }

  // Update the user's password and clear the reset token
  await updateUser(user.id, {
    password: newPassword,
    reset_token: null,
    reset_token_expiry: null,
  });

  return true;
}
