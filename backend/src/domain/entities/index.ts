// ── User Entity ──────────────────────────────────────────────────────────

export type UserRole = 'buyer' | 'streamer' | 'admin';

export interface UserEntity {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

// ── Shop Entity ───────────────────────────────────────────────────────────

export interface ShopEntity {
  id: string;
  ownerId: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Product Entity ────────────────────────────────────────────────────────

export interface ProductEntity {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  isFlashSale: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Order Entity ──────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'COMPENSATED';

export interface OrderEntity {
  id: string;
  userId: string;
  productId: string;
  shopId: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  idempotencyKey: string; // UNIQUE — prevents duplicate order rows
  traceId?: string; // X-Trace-Id for distributed tracing
  createdAt: Date;
  updatedAt: Date;
}

// ── KnowledgeDoc Entity (AI RAG) ──────────────────────────────────────────

export interface KnowledgeDocEntity {
  id: string;
  shopId: string; // MANDATORY — multi-tenant data isolation
  content: string;
  embedding?: number[]; // vector(1536) — null until embedded
  createdAt: Date;
  updatedAt: Date;
}

// ── RabbitMQ Message Payloads ─────────────────────────────────────────────

export interface OrderPendingEvent {
  userId: string;
  productId: string;
  shopId: string;
  quantity: number;
  totalPrice: number;
  idempotencyKey: string;
  traceId: string;
}

// ── JWT Payload ───────────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  shopId?: string; // Present for streamers
  role: UserRole;
  iat?: number;
  exp?: number;
}
