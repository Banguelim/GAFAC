import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Para SQLite, usamos text com check constraints em vez de enums
export const PRODUCT_TYPES = ['caldo', 'pizza', 'tipica'] as const;
export const PRODUCT_SIZES = ['pequeno', 'grande', 'unico', 'marmitex', 'cumbuquinha'] as const;
export const PAYMENT_METHODS = ['dinheiro', 'pix', 'aberto'] as const;
export const PAYMENT_STATUS = ['realizado', 'pendente'] as const;
export const DELIVERY_STATUS = ['realizada', 'pendente'] as const;

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default('vendor'), // 'admin' or 'vendor'
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Products table
export const products = sqliteTable("products", {
  id: text("id").primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'caldo', 'pizza', 'tipica'
  size: text("size").notNull().default('unico'), // 'pequeno', 'grande', etc.
  price: real("price").notNull(),
  active: integer("active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Orders table
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  orderNumber: integer("order_number").notNull().unique(),
  vendorId: text("vendor_id").notNull(),
  vendorName: text("vendor_name").notNull(),
  vendorPhone: text("vendor_phone"),
  customerName: text("customer_name"), // Optional, only for "em aberto"
  customerPhone: text("customer_phone"), // Optional
  paymentMethod: text("payment_method").notNull(), // 'dinheiro', 'pix', 'aberto'
  paymentStatus: text("payment_status").notNull().default('pendente'), // 'realizado', 'pendente'
  deliveryStatus: text("delivery_status").notNull().default('pendente'), // 'realizada', 'pendente'
  totalAmount: real("total_amount").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()).notNull(),
});

// Order items table
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey().$defaultFn(() => globalThis.crypto.randomUUID()),
  orderId: text("order_id").notNull(),
  productId: text("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  vendor: one(users, { fields: [orders.vendorId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  orderId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

// Extended types for API responses
export type OrderWithDetails = Order & {
  vendor: User;
  items: (OrderItem & { product: Product })[];
};

export type OrderStats = {
  ordersToday: number;
  revenueToday: number;
  pendingPayments: number;
  pendingDeliveries: number;
  paymentStats: {
    dinheiro: number;
    pix: number;
    aberto: number;
  };
  vendorStats: Array<{
    vendorId: string;
    vendorName: string;
    orderCount: number;
    revenue: number;
  }>;
  productStats: Array<{
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
  }>;
};
