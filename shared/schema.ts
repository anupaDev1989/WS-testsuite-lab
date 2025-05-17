import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  active: true,
});

// Test configuration schema
export const testConfigs = pgTable("test_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  method: text("method").notNull(),
  url: text("url").notNull(),
  parameters: text("parameters").notNull(),
  headers: text("headers").notNull(),
  testOptions: text("test_options").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTestConfigSchema = createInsertSchema(testConfigs).pick({
  name: true,
  method: true,
  url: true,
  parameters: true,
  headers: true,
  testOptions: true,
});

// Test results schema
export const testResults = pgTable("test_results", {
  id: serial("id").primaryKey(),
  testConfigId: integer("test_config_id").notNull(),
  status: text("status").notNull(),
  duration: integer("duration"),
  statusCode: integer("status_code"),
  response: text("response"),
  error: text("error"),
  backend: text("backend").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTestResultSchema = createInsertSchema(testResults).pick({
  testConfigId: true,
  status: true,
  duration: true,
  statusCode: true,
  response: true,
  error: true,
  backend: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTestConfig = z.infer<typeof insertTestConfigSchema>;
export type TestConfig = typeof testConfigs.$inferSelect;

export type InsertTestResult = z.infer<typeof insertTestResultSchema>;
export type TestResult = typeof testResults.$inferSelect;
