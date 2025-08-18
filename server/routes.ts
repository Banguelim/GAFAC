import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertOrderSchema, insertOrderItemSchema, insertUserSchema, insertProductSchema } from "@shared/schema";
import { generateTicketPDF } from "./services/pdfGenerator";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes (simplified for demo)
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, use proper session management
      res.json({ user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User routes
  app.get("/api/users", async (req, res) => {
    try {
      // This would need proper authorization in production
      res.json([]);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  // Order routes
  app.get("/api/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await storage.getOrders(limit);
      res.json(orders);
    } catch (error) {
      console.error("Get orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Get order error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      console.log("📋 Recebendo dados do pedido:", JSON.stringify(req.body, null, 2));
      
      const { order, items } = req.body;
      
      if (!order || !items) {
        return res.status(400).json({ message: "Order and items are required" });
      }
      
      console.log("🔍 Validando dados do pedido...");
      const orderData = insertOrderSchema.parse(order);
      
      console.log("🔍 Validando itens do pedido...");
      const itemsData = z.array(insertOrderItemSchema).parse(items);
      
      console.log("💾 Criando pedido no banco...");
      const createdOrder = await storage.createOrder(orderData, itemsData);
      
      console.log("✅ Pedido criado com sucesso:", createdOrder.id);
      res.status(201).json(createdOrder);
    } catch (error) {
      console.error("❌ Erro detalhado ao criar pedido:", error);
      
      // Se for erro de validação Zod, retornar detalhes
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Dados inválidos", 
          details: error.errors,
          received: req.body 
        });
      }
      
      // Outros erros
      res.status(400).json({ 
        message: error.message || "Erro ao criar pedido",
        error: error.toString()
      });
    }
  });

  app.put("/api/orders/:id", async (req, res) => {
    try {
      const { order, items } = req.body;
      
      console.log(`📝 Atualizando pedido ${req.params.id}:`, JSON.stringify(req.body, null, 2));
      
      const orderData = order ? insertOrderSchema.partial().parse(order) : {};
      const itemsData = items ? z.array(insertOrderItemSchema).parse(items) : undefined;
      
      const updatedOrder = await storage.updateOrder(req.params.id, orderData, itemsData);
      console.log(`✅ Pedido ${req.params.id} atualizado com sucesso`);
      
      res.json(updatedOrder);
    } catch (error) {
      console.error("Update order error:", error);
      
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: "Dados inválidos para atualização", 
          details: error.errors 
        });
      }
      
      res.status(400).json({ 
        message: error.message || "Falha ao atualizar pedido" 
      });
    }
  });

  app.delete("/api/orders/:id", async (req, res) => {
    try {
      console.log(`🗑️ Deletando pedido ${req.params.id}`);
      
      await storage.deleteOrder(req.params.id);
      
      console.log(`✅ Pedido ${req.params.id} deletado com sucesso`);
      res.json({ message: "Pedido deletado com sucesso" });
    } catch (error) {
      console.error("Delete order error:", error);
      res.status(400).json({ 
        message: error.message || "Falha ao deletar pedido" 
      });
    }
  });

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { paymentStatus, deliveryStatus } = req.body;
      const order = await storage.updateOrderStatus(req.params.id, paymentStatus, deliveryStatus);
      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(400).json({ message: "Failed to update order status" });
    }
  });

  // Vendor orders
  app.get("/api/vendors/:vendorId/orders", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const orders = await storage.getVendorOrders(req.params.vendorId, limit);
      res.json(orders);
    } catch (error) {
      console.error("Get vendor orders error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getOrderStats();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PDF ticket generation
  app.post("/api/orders/:id/ticket", async (req, res) => {
    try {
      const order = await storage.getOrder(req.params.id);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      const pdfBuffer = await generateTicketPDF(order);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="pedido-${order.orderNumber}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate ticket error:", error);
      res.status(500).json({ message: "Failed to generate ticket" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
