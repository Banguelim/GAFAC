import {
  users,
  products,
  orders,
  orderItems,
  type User,
  type InsertUser,
  type Product,
  type InsertProduct,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithDetails,
  type OrderStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
// import { randomUUID } from "crypto"; // Não necessário mais

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product operations
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;

  // Order operations
  getOrders(limit?: number): Promise<OrderWithDetails[]>;
  getOrder(id: string): Promise<OrderWithDetails | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails>;
  updateOrder(id: string, order: Partial<InsertOrder>, items?: InsertOrderItem[]): Promise<OrderWithDetails>;
  updateOrderStatus(id: string, paymentStatus?: string, deliveryStatus?: string): Promise<Order>;
  deleteOrder(id: string): Promise<void>;

  // Stats operations
  getOrderStats(startDate?: Date, endDate?: Date): Promise<OrderStats>;
  getVendorOrders(vendorId: string, limit?: number): Promise<OrderWithDetails[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.active, true)).orderBy(products.name);
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values(insertProduct)
      .returning();
    return product;
  }

  async updateProduct(id: string, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await db
      .update(products)
      .set(updateProduct)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async getOrders(limit = 50): Promise<OrderWithDetails[]> {
    return await db.query.orders.findMany({
      with: {
        vendor: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: desc(orders.createdAt),
      limit,
    });
  }

  async getOrder(id: string): Promise<OrderWithDetails | undefined> {
    return await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        vendor: true,
        items: {
          with: {
            product: true,
          },
        },
      },
    });
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithDetails> {
    const orderNumber = await this.generateOrderNumber();
    
    const [order] = await db
      .insert(orders)
      .values({ ...insertOrder, orderNumber })
      .returning();

    const orderItemsWithOrderId = items.map(item => ({
      ...item,
      orderId: order.id,
    }));

    await db.insert(orderItems).values(orderItemsWithOrderId);

    const createdOrder = await this.getOrder(order.id);
    if (!createdOrder) {
      throw new Error("Failed to create order");
    }

    return createdOrder;
  }

  async updateOrder(id: string, orderUpdate: Partial<InsertOrder>, items?: InsertOrderItem[]): Promise<OrderWithDetails> {
    // Atualizar dados do pedido
    if (Object.keys(orderUpdate).length > 0) {
      await db.update(orders)
        .set(orderUpdate)
        .where(eq(orders.id, id));
    }

    // Se novos itens foram fornecidos, substitui todos os itens
    if (items && items.length > 0) {
      // Remover itens existentes
      await db.delete(orderItems).where(eq(orderItems.orderId, id));
      
      // Adicionar novos itens
      const itemsWithOrderId = items.map(item => ({
        ...item,
        orderId: id,
      }));
      await db.insert(orderItems).values(itemsWithOrderId);
    }

    // Retornar pedido atualizado
    const updatedOrder = await this.getOrder(id);
    if (!updatedOrder) {
      throw new Error("Failed to update order");
    }

    return updatedOrder;
  }

  async updateOrderStatus(id: string, paymentStatus?: string, deliveryStatus?: string): Promise<Order> {
    const updateData: Partial<Order> = {};
    if (paymentStatus) updateData.paymentStatus = paymentStatus as "realizado" | "pendente";
    if (deliveryStatus) updateData.deliveryStatus = deliveryStatus as "realizada" | "pendente";

    const [order] = await db
      .update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    return order;
  }

  async deleteOrder(id: string): Promise<void> {
    // Primeiro, deletar os itens do pedido
    await db.delete(orderItems).where(eq(orderItems.orderId, id));
    
    // Depois, deletar o pedido
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getOrderStats(startDate?: Date, endDate?: Date): Promise<OrderStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Today's orders count
    const [{ count: ordersToday }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, today));

    // Today's revenue
    const [{ sum: revenueToday }] = await db
      .select({ sum: sql<number>`coalesce(sum(${orders.totalAmount}), 0)` })
      .from(orders)
      .where(gte(orders.createdAt, today));

    // Pending payments count
    const [{ count: pendingPayments }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.paymentStatus, 'pendente'));

    // Pending deliveries count
    const [{ count: pendingDeliveries }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(eq(orders.deliveryStatus, 'pendente'));

    // Payment method stats
    const paymentStats = await db
      .select({
        method: orders.paymentMethod,
        total: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .where(gte(orders.createdAt, today))
      .groupBy(orders.paymentMethod);

    const paymentStatsObj = {
      dinheiro: 0,
      pix: 0,
      aberto: 0,
    };

    paymentStats.forEach(stat => {
      paymentStatsObj[stat.method as keyof typeof paymentStatsObj] = Number(stat.total);
    });

    // Vendor stats
    const vendorStats = await db
      .select({
        vendorId: orders.vendorId,
        vendorName: users.name,
        orderCount: sql<number>`count(*)`,
        revenue: sql<number>`coalesce(sum(${orders.totalAmount}), 0)`,
      })
      .from(orders)
      .innerJoin(users, eq(orders.vendorId, users.id))
      .where(gte(orders.createdAt, today))
      .groupBy(orders.vendorId, users.name);

    // Product stats
    const productStats = await db
      .select({
        productId: orderItems.productId,
        productName: products.name,
        quantity: sql<number>`sum(${orderItems.quantity})`,
        revenue: sql<number>`coalesce(sum(${orderItems.totalPrice}), 0)`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(gte(orders.createdAt, today))
      .groupBy(orderItems.productId, products.name);

    return {
      ordersToday: Number(ordersToday),
      revenueToday: Number(revenueToday),
      pendingPayments: Number(pendingPayments),
      pendingDeliveries: Number(pendingDeliveries),
      paymentStats: paymentStatsObj,
      vendorStats: vendorStats.map(stat => ({
        vendorId: stat.vendorId,
        vendorName: stat.vendorName,
        orderCount: Number(stat.orderCount),
        revenue: Number(stat.revenue),
      })),
      productStats: productStats.map(stat => ({
        productId: stat.productId,
        productName: stat.productName,
        quantity: Number(stat.quantity),
        revenue: Number(stat.revenue),
      })),
    };
  }

  async getVendorOrders(vendorId: string, limit = 20): Promise<OrderWithDetails[]> {
    return await db.query.orders.findMany({
      where: eq(orders.vendorId, vendorId),
      with: {
        vendor: true,
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: desc(orders.createdAt),
      limit,
    });
  }

  private async generateOrderNumber(): Promise<number> {
    const [result] = await db
      .select({ max: sql<number>`coalesce(max(${orders.orderNumber}), 0)` })
      .from(orders);
    
    return (result?.max || 0) + 1;
  }
}

export const storage = new DatabaseStorage();
