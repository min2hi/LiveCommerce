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

// ── Livestream Entity ──────────────────────────────────────────────────────

export type LivestreamStatus = 'PENDING' | 'LIVE' | 'ENDED';

export interface LivestreamEntity {
  id: string;
  shopId: string;
  title: string;
  streamKey: string;
  status: LivestreamStatus;
  viewers: number;
  createdAt: Date;
  updatedAt: Date;
  endedAt?: Date;
  shopName?: string;
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

// ── Scheduled Stream Entities ──────────────────────────────────────────────

export interface ScheduledStreamEntity {
  id: string;
  shopId: string;
  title: string;
  description?: string;
  scheduledTime: Date;
  bannerUrl?: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  createdAt: Date;
  updatedAt: Date;
  shopName?: string;
}

export interface StreamReminderEntity {
  id: string;
  streamId: string;
  userId: string;
  createdAt: Date;
}

// ── Auction Entities ───────────────────────────────────────────────────────

export interface AuctionEntity {
  id: string;
  shopId: string;
  productId?: string;
  title: string;
  startPrice: number;
  currentPrice: number;
  minIncrement: number;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startedAt?: Date;
  endedAt?: Date;
  winnerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuctionBidEntity {
  id: string;
  auctionId: string;
  userId: string;
  bidAmount: number;
  createdAt: Date;
}
