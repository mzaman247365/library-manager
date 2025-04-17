import { pool, db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcrypt";

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

// Helper function to hash a password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log("Starting admin user creation...");

  try {
    // Check if admin user exists
    const adminUser = await db.select().from(users).where(eq(users.username, "admin"));
    
    if (adminUser.length === 0) {
      console.log("Creating admin user...");
      
      // Create admin user
      const newAdmin = await db.insert(users).values({
        username: "admin",
        password: await hashPassword("n1mD@"),
        fullName: "Administrator",
        email: "admin@library.local",
        isAdmin: true
      }).returning();
      
      console.log("Admin user created successfully:", newAdmin[0].username);
    } else {
      console.log("Admin user already exists");
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    // Close the database connection
    await pool.end();
    process.exit(0);
  }
}

main();