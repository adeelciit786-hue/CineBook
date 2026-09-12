import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// --- ENUMS ---
export const userRoleEnum = pgEnum('user_role', ['CUSTOMER', 'ADMIN']);

export const seatTypeEnum = pgEnum('seat_type', [
  'STANDARD',
  'VIP',
  'RECLINER',
  'ACCESSIBLE',
]);

export const seatStatusEnum = pgEnum('seat_status', [
  'AVAILABLE',
  'HELD',
  'BOOKED',
  'BLOCKED',
]);

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'EXPIRED',
  'REFUNDED',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'PROCESSING',
  'SUCCEEDED',
  'FAILED',
  'REFUNDED',
  'CANCELLED',
]);

export const paymentProviderEnum = pgEnum('payment_provider', [
  'STRIPE',
  'TEST_PAYMENT',
]);

export const movieRatingEnum = pgEnum('movie_rating', [
  'G',
  'PG',
  'PG-13',
  'R',
  'NC-17',
]);

export const screenFormatEnum = pgEnum('screen_format', [
  '2D',
  '3D',
  'IMAX',
  'DOLBY_CINEMA',
  '4DX',
]);

// --- 1. USERS ---
export const users = pgTable(
  'users',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 50 }),
    role: userRoleEnum('role').default('CUSTOMER').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
  })
);

// --- 2. GENRES ---
export const genres = pgTable(
  'genres',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index('genres_slug_idx').on(table.slug),
  })
);

// --- 3. MOVIES ---
export const movies = pgTable(
  'movies',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    synopsis: text('synopsis').notNull(),
    posterUrl: text('poster_url').notNull(),
    backdropUrl: text('backdrop_url').notNull(),
    trailerUrl: text('trailer_url'),
    durationMins: integer('duration_mins').notNull(),
    rating: movieRatingEnum('rating').default('PG-13').notNull(),
    language: varchar('language', { length: 50 }).default('English').notNull(),
    releaseDate: timestamp('release_date', { withTimezone: true }).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    featured: boolean('featured').default(false).notNull(),
    ratingScore: integer('rating_score').default(85).notNull(), // e.g., 85% / 100
    director: varchar('director', { length: 255 }),
    castMembers: text('cast_members'), // comma-separated or stringified JSON
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index('movies_slug_idx').on(table.slug),
    activeIdx: index('movies_active_idx').on(table.isActive),
    releaseDateIdx: index('movies_release_date_idx').on(table.releaseDate),
  })
);

// --- 4. MOVIE_GENRES (Junction) ---
export const movieGenres = pgTable(
  'movie_genres',
  {
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    genreId: uuid('genre_id')
      .notNull()
      .references(() => genres.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.movieId, table.genreId] }),
    movieIdx: index('movie_genres_movie_idx').on(table.movieId),
    genreIdx: index('movie_genres_genre_idx').on(table.genreId),
  })
);

// --- 5. CINEMAS ---
export const cinemas = pgTable(
  'cinemas',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    address: varchar('address', { length: 255 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 100 }).notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    phone: varchar('phone', { length: 50 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    amenities: text('amenities'), // JSON string: ["IMAX", "Dolby Atmos", "Recliner Seats", "Bar"]
    imageUrl: text('image_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    slugIdx: index('cinemas_slug_idx').on(table.slug),
    cityIdx: index('cinemas_city_idx').on(table.city),
  })
);

// --- 6. AUDITORIUMS ---
export const auditoriums = pgTable(
  'auditoriums',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    cinemaId: uuid('cinema_id')
      .notNull()
      .references(() => cinemas.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 100 }).notNull(), // e.g., "Screen 1 - IMAX", "Screen 2 - Dolby"
    screenType: screenFormatEnum('screen_type').default('2D').notNull(),
    totalSeats: integer('total_seats').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    cinemaScreenUnique: uniqueIndex('auditoriums_cinema_name_unique').on(
      table.cinemaId,
      table.name
    ),
    cinemaIdx: index('auditoriums_cinema_idx').on(table.cinemaId),
  })
);

// --- 7. SEATS ---
export const seats = pgTable(
  'seats',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    auditoriumId: uuid('auditorium_id')
      .notNull()
      .references(() => auditoriums.id, { onDelete: 'cascade' }),
    row: varchar('row', { length: 5 }).notNull(), // e.g. "A", "B", "C"
    number: integer('number').notNull(), // e.g. 1, 2, 3
    seatType: seatTypeEnum('seat_type').default('STANDARD').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    auditoriumSeatUnique: uniqueIndex('seats_auditorium_row_number_unique').on(
      table.auditoriumId,
      table.row,
      table.number
    ),
    auditoriumIdx: index('seats_auditorium_idx').on(table.auditoriumId),
  })
);

// --- 8. SHOWTIMES ---
export const showtimes = pgTable(
  'showtimes',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    movieId: uuid('movie_id')
      .notNull()
      .references(() => movies.id, { onDelete: 'cascade' }),
    auditoriumId: uuid('auditorium_id')
      .notNull()
      .references(() => auditoriums.id, { onDelete: 'cascade' }),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }).notNull(),
    basePriceCents: integer('base_price_cents').notNull(), // e.g. 1500 ($15.00)
    format: screenFormatEnum('format').default('2D').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    movieIdx: index('showtimes_movie_idx').on(table.movieId),
    auditoriumIdx: index('showtimes_auditorium_idx').on(table.auditoriumId),
    startTimeIdx: index('showtimes_start_time_idx').on(table.startTime),
  })
);

// --- 9. SHOWTIME_SEATS (Concurrency & Hold Engine) ---
export const showtimeSeats = pgTable(
  'showtime_seats',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    showtimeId: uuid('showtime_id')
      .notNull()
      .references(() => showtimes.id, { onDelete: 'cascade' }),
    seatId: uuid('seat_id')
      .notNull()
      .references(() => seats.id, { onDelete: 'cascade' }),
    status: seatStatusEnum('status').default('AVAILABLE').notNull(),
    heldUntil: timestamp('held_until', { withTimezone: true }),
    heldByBookingId: uuid('held_by_booking_id'), // linked to active pending booking
    version: integer('version').default(0).notNull(), // Optimistic lock / audit version
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    showtimeSeatUnique: uniqueIndex('showtime_seats_showtime_seat_unique').on(
      table.showtimeId,
      table.seatId
    ),
    showtimeIdx: index('showtime_seats_showtime_idx').on(table.showtimeId),
    statusIdx: index('showtime_seats_status_idx').on(table.status),
    heldUntilIdx: index('showtime_seats_held_until_idx').on(table.heldUntil),
  })
);

// --- 10. BOOKINGS ---
export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    bookingReference: varchar('booking_reference', { length: 20 })
      .notNull()
      .unique(), // e.g. "CB-849204"
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    showtimeId: uuid('showtime_id')
      .notNull()
      .references(() => showtimes.id, { onDelete: 'cascade' }),
    subtotalCents: integer('subtotal_cents').notNull(),
    feeAmountCents: integer('fee_amount_cents').notNull(), // $1.50 per seat fee
    taxAmountCents: integer('tax_amount_cents').notNull(), // 8% sales tax
    totalAmountCents: integer('total_amount_cents').notNull(),
    status: bookingStatusEnum('status').default('PENDING').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // 10-minute hold TTL
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    referenceIdx: index('bookings_reference_idx').on(table.bookingReference),
    userIdx: index('bookings_user_idx').on(table.userId),
    showtimeIdx: index('bookings_showtime_idx').on(table.showtimeId),
    statusIdx: index('bookings_status_idx').on(table.status),
    expiresAtIdx: index('bookings_expires_at_idx').on(table.expiresAt),
  })
);

// --- 11. BOOKING_ITEMS ---
export const bookingItems = pgTable(
  'booking_items',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    showtimeSeatId: uuid('showtime_seat_id')
      .notNull()
      .references(() => showtimeSeats.id, { onDelete: 'cascade' }),
    seatId: uuid('seat_id')
      .notNull()
      .references(() => seats.id, { onDelete: 'cascade' }),
    priceCents: integer('price_cents').notNull(),
    seatLabel: varchar('seat_label', { length: 10 }).notNull(), // e.g. "F12"
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    bookingIdx: index('booking_items_booking_idx').on(table.bookingId),
    seatIdx: index('booking_items_seat_idx').on(table.seatId),
  })
);

// --- 12. PAYMENTS ---
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 10 }).default('USD').notNull(),
    provider: paymentProviderEnum('provider').default('TEST_PAYMENT').notNull(),
    providerTransactionId: varchar('provider_transaction_id', { length: 255 }),
    providerPaymentIntentId: varchar('provider_payment_intent_id', { length: 255 }),
    idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
    status: paymentStatusEnum('status').default('PENDING').notNull(),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    bookingIdx: index('payments_booking_idx').on(table.bookingId),
    userIdx: index('payments_user_idx').on(table.userId),
    idempotencyIdx: index('payments_idempotency_idx').on(table.idempotencyKey),
    statusIdx: index('payments_status_idx').on(table.status),
  })
);

// --- 13. TICKETS ---
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    bookingId: uuid('booking_id')
      .notNull()
      .references(() => bookings.id, { onDelete: 'cascade' }),
    bookingItemId: uuid('booking_item_id')
      .notNull()
      .references(() => bookingItems.id, { onDelete: 'cascade' }),
    ticketCode: varchar('ticket_code', { length: 50 }).notNull().unique(), // e.g. "TCK-9482-A4"
    qrCodeData: text('qr_code_data').notNull(), // Signed JSON string or payload
    isUsed: boolean('is_used').default(false).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    codeIdx: index('tickets_code_idx').on(table.ticketCode),
    bookingIdx: index('tickets_booking_idx').on(table.bookingId),
  })
);

// --- 14. AUDIT_LOGS ---
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id'),
    action: varchar('action', { length: 100 }).notNull(), // e.g. "HOLD_SEATS", "PAYMENT_SUCCESS", "BOOKING_CANCELLED", "RELEASE_EXPIRED_HOLDS"
    entityType: varchar('entity_type', { length: 50 }).notNull(), // e.g. "BOOKING", "SHOWTIME_SEAT", "PAYMENT"
    entityId: varchar('entity_id', { length: 255 }).notNull(),
    metadata: text('metadata'), // JSON string with full details
    ipAddress: varchar('ip_address', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => ({
    actionIdx: index('audit_logs_action_idx').on(table.action),
    entityIdx: index('audit_logs_entity_idx').on(table.entityType, table.entityId),
    createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  })
);

// --- DRIZZLE RELATIONS ---

export const usersRelations = relations(users, ({ many }) => ({
  bookings: many(bookings),
  payments: many(payments),
}));

export const moviesRelations = relations(movies, ({ many }) => ({
  movieGenres: many(movieGenres),
  showtimes: many(showtimes),
}));

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(movieGenres),
}));

export const movieGenresRelations = relations(movieGenres, ({ one }) => ({
  movie: one(movies, {
    fields: [movieGenres.movieId],
    references: [movies.id],
  }),
  genre: one(genres, {
    fields: [movieGenres.genreId],
    references: [genres.id],
  }),
}));

export const cinemasRelations = relations(cinemas, ({ many }) => ({
  auditoriums: many(auditoriums),
}));

export const auditoriumsRelations = relations(auditoriums, ({ one, many }) => ({
  cinema: one(cinemas, {
    fields: [auditoriums.cinemaId],
    references: [cinemas.id],
  }),
  seats: many(seats),
  showtimes: many(showtimes),
}));

export const seatsRelations = relations(seats, ({ one, many }) => ({
  auditorium: one(auditoriums, {
    fields: [seats.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
}));

export const showtimesRelations = relations(showtimes, ({ one, many }) => ({
  movie: one(movies, {
    fields: [showtimes.movieId],
    references: [movies.id],
  }),
  auditorium: one(auditoriums, {
    fields: [showtimes.auditoriumId],
    references: [auditoriums.id],
  }),
  showtimeSeats: many(showtimeSeats),
  bookings: many(bookings),
}));

export const showtimeSeatsRelations = relations(showtimeSeats, ({ one }) => ({
  showtime: one(showtimes, {
    fields: [showtimeSeats.showtimeId],
    references: [showtimes.id],
  }),
  seat: one(seats, {
    fields: [showtimeSeats.seatId],
    references: [seats.id],
  }),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  showtime: one(showtimes, {
    fields: [bookings.showtimeId],
    references: [showtimes.id],
  }),
  bookingItems: many(bookingItems),
  payments: many(payments),
  tickets: many(tickets),
}));

export const bookingItemsRelations = relations(bookingItems, ({ one }) => ({
  booking: one(bookings, {
    fields: [bookingItems.bookingId],
    references: [bookings.id],
  }),
  showtimeSeat: one(showtimeSeats, {
    fields: [bookingItems.showtimeSeatId],
    references: [showtimeSeats.id],
  }),
  seat: one(seats, {
    fields: [bookingItems.seatId],
    references: [seats.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  booking: one(bookings, {
    fields: [payments.bookingId],
    references: [bookings.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  booking: one(bookings, {
    fields: [tickets.bookingId],
    references: [bookings.id],
  }),
  bookingItem: one(bookingItems, {
    fields: [tickets.bookingItemId],
    references: [bookingItems.id],
  }),
}));
