import { formatCents, generateBookingReference, generateTicketCode } from '../lib/formatters';
import { signTicketPayload } from '../lib/qrcode';
import { logger } from '../lib/logger';
import { processPayment } from '../lib/payment';
import bcrypt from 'bcryptjs';

// Interface definitions matching our database models
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone?: string;
  role: 'CUSTOMER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface GenreRecord {
  id: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface MovieRecord {
  id: string;
  title: string;
  slug: string;
  synopsis: string;
  posterUrl: string;
  backdropUrl: string;
  trailerUrl?: string;
  durationMins: number;
  rating: 'G' | 'PG' | 'PG-13' | 'R' | 'NC-17';
  language: string;
  releaseDate: Date;
  isActive: boolean;
  featured: boolean;
  ratingScore: number;
  director?: string;
  castMembers?: string;
  genreIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CinemaRecord {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  amenities: string[];
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditoriumRecord {
  id: string;
  cinemaId: string;
  name: string;
  screenType: '2D' | '3D' | 'IMAX' | 'DOLBY_CINEMA' | '4DX';
  totalSeats: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SeatRecord {
  id: string;
  auditoriumId: string;
  row: string;
  number: number;
  seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE';
  createdAt: Date;
}

export interface ShowtimeRecord {
  id: string;
  movieId: string;
  auditoriumId: string;
  startTime: Date;
  endTime: Date;
  basePriceCents: number;
  format: '2D' | '3D' | 'IMAX' | 'DOLBY_CINEMA' | '4DX';
  isActive: boolean;
  createdAt: Date;
}

export interface ShowtimeSeatRecord {
  id: string;
  showtimeId: string;
  seatId: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED' | 'BLOCKED';
  heldUntil?: Date | null;
  heldByBookingId?: string | null;
  version: number;
  updatedAt: Date;
}

export interface BookingRecord {
  id: string;
  bookingReference: string;
  userId: string;
  showtimeId: string;
  subtotalCents: number;
  feeAmountCents: number;
  taxAmountCents: number;
  totalAmountCents: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED' | 'REFUNDED';
  expiresAt: Date;
  idempotencyKey?: string;
  cancelledAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingItemRecord {
  id: string;
  bookingId: string;
  showtimeSeatId: string;
  seatId: string;
  priceCents: number;
  seatLabel: string;
  createdAt: Date;
}

export interface PaymentRecord {
  id: string;
  bookingId: string;
  userId: string;
  amountCents: number;
  currency: string;
  provider: 'STRIPE' | 'TEST_PAYMENT';
  providerTransactionId?: string;
  providerPaymentIntentId?: string;
  idempotencyKey?: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketRecord {
  id: string;
  bookingId: string;
  bookingItemId: string;
  ticketCode: string;
  qrCodeData: string;
  isUsed: boolean;
  usedAt?: Date | null;
  createdAt: Date;
}

export interface AuditLogRecord {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: string;
  ipAddress?: string;
  createdAt: Date;
}

// Global In-Memory / Hybrid Store State
class CineBookStore {
  public users: Map<string, UserRecord> = new Map();
  public genres: Map<string, GenreRecord> = new Map();
  public movies: Map<string, MovieRecord> = new Map();
  public cinemas: Map<string, CinemaRecord> = new Map();
  public auditoriums: Map<string, AuditoriumRecord> = new Map();
  public seats: Map<string, SeatRecord> = new Map();
  public showtimes: Map<string, ShowtimeRecord> = new Map();
  public showtimeSeats: Map<string, ShowtimeSeatRecord> = new Map();
  public bookings: Map<string, BookingRecord> = new Map();
  public bookingItems: Map<string, BookingItemRecord> = new Map();
  public payments: Map<string, PaymentRecord> = new Map();
  public tickets: Map<string, TicketRecord> = new Map();
  public auditLogs: AuditLogRecord[] = [];

  private isInitialized = false;
  // Mutex for atomic hold & checkout operations
  private lockPromise: Promise<void> = Promise.resolve();

  private async acquireLock(): Promise<() => void> {
    let release: () => void;
    const nextLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.lockPromise;
    this.lockPromise = currentLock.then(() => nextLock);
    await currentLock;
    return release!;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    await this.seedInitialData();
    this.isInitialized = true;
    logger.info('CineBook Data Store initialized with realistic catalog and showtimes');
  }

  public async seedInitialData(): Promise<void> {
    this.users.clear();
    this.genres.clear();
    this.movies.clear();
    this.cinemas.clear();
    this.auditoriums.clear();
    this.seats.clear();
    this.showtimes.clear();
    this.showtimeSeats.clear();
    this.bookings.clear();
    this.bookingItems.clear();
    this.payments.clear();
    this.tickets.clear();
    this.auditLogs = [];

    // 1. Seed Users
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    const userPassword = await bcrypt.hash('UserPassword123!', 10);

    const adminUser: UserRecord = {
      id: 'u-admin-001',
      email: 'admin@cinebook.com',
      passwordHash: adminPassword,
      fullName: 'Alexander Vance (Cinema GM)',
      phone: '+1 (555) 019-2834',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const customerUser: UserRecord = {
      id: 'u-cust-001',
      email: 'user@cinebook.com',
      passwordHash: userPassword,
      fullName: 'Sarah Jenkins',
      phone: '+1 (555) 482-9102',
      role: 'CUSTOMER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(customerUser.id, customerUser);

    // 2. Seed Genres
    const genreList = [
      { id: 'g-sci-fi', name: 'Sci-Fi', slug: 'sci-fi' },
      { id: 'g-action', name: 'Action', slug: 'action' },
      { id: 'g-drama', name: 'Drama', slug: 'drama' },
      { id: 'g-adventure', name: 'Adventure', slug: 'adventure' },
      { id: 'g-thriller', name: 'Thriller', slug: 'thriller' },
      { id: 'g-animation', name: 'Animation', slug: 'animation' },
      { id: 'g-imax', name: 'IMAX Experience', slug: 'imax' },
    ];

    for (const g of genreList) {
      this.genres.set(g.id, { ...g, createdAt: new Date() });
    }

    // 3. Seed Movies
    const movieList: Omit<MovieRecord, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'm-dune-2',
        title: 'Dune: Part Two',
        slug: 'dune-part-two',
        synopsis:
          'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the universe, he endeavors to prevent a terrible future.',
        posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
        durationMins: 166,
        rating: 'PG-13',
        language: 'English',
        releaseDate: new Date('2026-03-01'),
        isActive: true,
        featured: true,
        ratingScore: 94,
        director: 'Denis Villeneuve',
        castMembers: 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler',
        genreIds: ['g-sci-fi', 'g-adventure', 'g-imax'],
      },
      {
        id: 'm-oppenheimer',
        title: 'Oppenheimer',
        slug: 'oppenheimer',
        synopsis:
          'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during the Manhattan Project, exploring the moral and geopolitical aftermath.',
        posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=uYPbbksJxIg',
        durationMins: 180,
        rating: 'R',
        language: 'English',
        releaseDate: new Date('2026-02-15'),
        isActive: true,
        featured: true,
        ratingScore: 93,
        director: 'Christopher Nolan',
        castMembers: 'Cillian Murphy, Emily Blunt, Matt Damon, Robert Downey Jr., Florence Pugh',
        genreIds: ['g-drama', 'g-thriller', 'g-imax'],
      },
      {
        id: 'm-interstellar-re',
        title: 'Interstellar: 10th Anniversary IMAX',
        slug: 'interstellar-imax',
        synopsis:
          'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
        durationMins: 169,
        rating: 'PG-13',
        language: 'English',
        releaseDate: new Date('2026-04-10'),
        isActive: true,
        featured: true,
        ratingScore: 96,
        director: 'Christopher Nolan',
        castMembers: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain, Michael Caine',
        genreIds: ['g-sci-fi', 'g-drama', 'g-adventure'],
      },
      {
        id: 'm-cyber-odyssey',
        title: 'Cyber Odyssey: Neon Protocol',
        slug: 'cyber-odyssey-neon-protocol',
        synopsis:
          'In a futuristic metropolis powered by synthetic consciousness, an elite digital detective uncovers a conspiracy that threatens to rewrite human thought across the global neural grid.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1600&auto=format&fit=crop',
        trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        durationMins: 142,
        rating: 'PG-13',
        language: 'English',
        releaseDate: new Date('2026-05-20'),
        isActive: true,
        featured: false,
        ratingScore: 88,
        director: 'Elena Kostic',
        castMembers: 'Kaelen Ross, Maya Lin, Takeshi Kovacs',
        genreIds: ['g-sci-fi', 'g-action', 'g-thriller'],
      },
      {
        id: 'm-aurora-dreams',
        title: 'Aurora: Guardians of the Sky',
        slug: 'aurora-guardians-of-the-sky',
        synopsis:
          'An animated visual spectacle following a young celestial cartographer who discovers the legendary Aurora Loom, the cosmic engine that paints the night skies.',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
        backdropUrl: 'https://images.unsplash.com/photo-1531306728370-e2ebd9d7bb99?q=80&w=1600&auto=format&fit=crop',
        durationMins: 108,
        rating: 'PG',
        language: 'English',
        releaseDate: new Date('2026-06-01'),
        isActive: true,
        featured: false,
        ratingScore: 91,
        director: 'Kenji Sato',
        castMembers: 'Aria Thorne, Leo Sterling, Gemma Chan',
        genreIds: ['g-animation', 'g-adventure'],
      },
    ];

    for (const m of movieList) {
      this.movies.set(m.id, {
        ...m,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 4. Seed Cinemas
    const cinemaList: Omit<CinemaRecord, 'createdAt' | 'updatedAt'>[] = [
      {
        id: 'c-grand-imax',
        name: 'CineBook Grand IMAX & Dolby Cinema',
        slug: 'cinebook-grand-imax',
        address: '777 Broadway Avenue, Cinema Square',
        city: 'New York',
        state: 'NY',
        postalCode: '10003',
        phone: '+1 (212) 555-0144',
        email: 'grand@cinebook.com',
        amenities: [
          'IMAX with Laser',
          'Dolby Atmos Sound',
          'VIP Heated Recliners',
          'Full Cocktail Lounge',
          'Gourmet Dining',
          'Complimentary Valet Parking',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1200&auto=format&fit=crop',
        isActive: true,
      },
      {
        id: 'c-sunset-multiplex',
        name: 'CineBook Sunset Luxe Cinema',
        slug: 'cinebook-sunset-luxe',
        address: '8400 Sunset Boulevard',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90069',
        phone: '+1 (310) 555-0199',
        email: 'sunset@cinebook.com',
        amenities: [
          'Dolby Cinema',
          '4DX Motion Seats',
          'Luxury Daybeds',
          'In-Seat Waiter Service',
          'Rooftop Bar',
        ],
        imageUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?q=80&w=1200&auto=format&fit=crop',
        isActive: true,
      },
    ];

    for (const c of cinemaList) {
      this.cinemas.set(c.id, {
        ...c,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // 5. Seed Auditoriums & Seats
    const auditoriumConfigs = [
      {
        id: 'aud-grand-1',
        cinemaId: 'c-grand-imax',
        name: 'Auditorium 1 - IMAX Grand Laser',
        screenType: 'IMAX' as const,
        rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        seatsPerRow: 12,
      },
      {
        id: 'aud-grand-2',
        cinemaId: 'c-grand-imax',
        name: 'Auditorium 2 - Dolby Atmos Prime',
        screenType: 'DOLBY_CINEMA' as const,
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        seatsPerRow: 10,
      },
      {
        id: 'aud-sunset-1',
        cinemaId: 'c-sunset-multiplex',
        name: 'Auditorium 1 - Sunset Luxe Suite',
        screenType: 'DOLBY_CINEMA' as const,
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        seatsPerRow: 10,
      },
    ];

    for (const aud of auditoriumConfigs) {
      const totalSeats = aud.rows.length * aud.seatsPerRow;
      this.auditoriums.set(aud.id, {
        id: aud.id,
        cinemaId: aud.cinemaId,
        name: aud.name,
        screenType: aud.screenType,
        totalSeats,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Generate Seats for this auditorium
      for (const row of aud.rows) {
        for (let num = 1; num <= aud.seatsPerRow; num++) {
          const seatId = `seat-${aud.id}-${row}${num}`;
          let seatType: 'STANDARD' | 'VIP' | 'RECLINER' | 'ACCESSIBLE' = 'STANDARD';

          if (row === 'A' && (num === 1 || num === aud.seatsPerRow)) {
            seatType = 'ACCESSIBLE';
          } else if (row === 'D' || row === 'E' || row === 'F') {
            seatType = 'VIP';
          } else if (row === 'G' || row === 'H') {
            seatType = 'RECLINER';
          }

          this.seats.set(seatId, {
            id: seatId,
            auditoriumId: aud.id,
            row,
            number: num,
            seatType,
            createdAt: new Date(),
          });
        }
      }
    }

    // 6. Seed Showtimes & Showtime Seats
    const baseDate = new Date();
    // Normalize to today and upcoming 3 days
    const showtimeSchedules = [
      // Dune Part Two showtimes
      {
        id: 'st-dune-today-1',
        movieId: 'm-dune-2',
        auditoriumId: 'aud-grand-1',
        hourOffset: 2, // 2 hours from now
        basePriceCents: 1800, // $18.00 base
        format: 'IMAX' as const,
      },
      {
        id: 'st-dune-today-2',
        movieId: 'm-dune-2',
        auditoriumId: 'aud-grand-1',
        hourOffset: 6,
        basePriceCents: 2000, // $20.00 evening IMAX
        format: 'IMAX' as const,
      },
      {
        id: 'st-dune-tomorrow-1',
        movieId: 'm-dune-2',
        auditoriumId: 'aud-sunset-1',
        hourOffset: 26,
        basePriceCents: 1900,
        format: 'DOLBY_CINEMA' as const,
      },
      // Oppenheimer showtimes
      {
        id: 'st-opp-today-1',
        movieId: 'm-oppenheimer',
        auditoriumId: 'aud-grand-2',
        hourOffset: 3,
        basePriceCents: 1700,
        format: 'DOLBY_CINEMA' as const,
      },
      {
        id: 'st-opp-today-2',
        movieId: 'm-oppenheimer',
        auditoriumId: 'aud-grand-2',
        hourOffset: 7,
        basePriceCents: 1900,
        format: 'DOLBY_CINEMA' as const,
      },
      // Interstellar showtimes
      {
        id: 'st-inter-today-1',
        movieId: 'm-interstellar-re',
        auditoriumId: 'aud-grand-1',
        hourOffset: 10,
        basePriceCents: 2200, // $22.00 special engagement
        format: 'IMAX' as const,
      },
    ];

    for (const st of showtimeSchedules) {
      const startTime = new Date(baseDate.getTime() + st.hourOffset * 3600 * 1000);
      const movie = this.movies.get(st.movieId);
      const duration = movie?.durationMins || 120;
      const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

      this.showtimes.set(st.id, {
        id: st.id,
        movieId: st.movieId,
        auditoriumId: st.auditoriumId,
        startTime,
        endTime,
        basePriceCents: st.basePriceCents,
        format: st.format,
        isActive: true,
        createdAt: new Date(),
      });

      // Populate showtime_seats for this showtime
      const audSeats = Array.from(this.seats.values()).filter(
        (s) => s.auditoriumId === st.auditoriumId
      );

      for (const seat of audSeats) {
        const stSeatId = `sts-${st.id}-${seat.row}${seat.number}`;
        
        // Randomly simulate a few pre-booked seats to show realistic map
        const isPreBooked =
          (seat.row === 'D' && (seat.number === 5 || seat.number === 6)) ||
          (seat.row === 'E' && (seat.number === 6 || seat.number === 7));

        this.showtimeSeats.set(stSeatId, {
          id: stSeatId,
          showtimeId: st.id,
          seatId: seat.id,
          status: isPreBooked ? 'BOOKED' : 'AVAILABLE',
          heldUntil: null,
          heldByBookingId: null,
          version: 0,
          updatedAt: new Date(),
        });
      }
    }
  }

  // --- QUERY METHODS ---

  public async getMovies(filters?: {
    genreSlug?: string;
    search?: string;
    language?: string;
    cinemaId?: string;
    featured?: boolean;
  }): Promise<MovieRecord[]> {
    await this.initialize();
    let result = Array.from(this.movies.values()).filter((m) => m.isActive);

    if (filters?.featured !== undefined) {
      result = result.filter((m) => m.featured === filters.featured);
    }

    if (filters?.genreSlug) {
      const genre = Array.from(this.genres.values()).find(
        (g) => g.slug === filters.genreSlug
      );
      if (genre) {
        result = result.filter((m) => m.genreIds.includes(genre.id));
      }
    }

    if (filters?.language) {
      result = result.filter(
        (m) => m.language.toLowerCase() === filters.language?.toLowerCase()
      );
    }

    if (filters?.search) {
      const term = filters.search.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(term) ||
          m.synopsis.toLowerCase().includes(term) ||
          m.director?.toLowerCase().includes(term) ||
          m.castMembers?.toLowerCase().includes(term)
      );
    }

    return result;
  }

  public async getMovieBySlug(slug: string): Promise<MovieRecord | null> {
    await this.initialize();
    return (
      Array.from(this.movies.values()).find((m) => m.slug === slug) || null
    );
  }

  public async getMovieById(id: string): Promise<MovieRecord | null> {
    await this.initialize();
    return this.movies.get(id) || null;
  }

  public async getCinemas(): Promise<CinemaRecord[]> {
    await this.initialize();
    return Array.from(this.cinemas.values()).filter((c) => c.isActive);
  }

  public async getCinemaBySlug(slug: string): Promise<CinemaRecord | null> {
    await this.initialize();
    return (
      Array.from(this.cinemas.values()).find((c) => c.slug === slug) || null
    );
  }

  public async getCinemaById(id: string): Promise<CinemaRecord | null> {
    await this.initialize();
    return this.cinemas.get(id) || null;
  }

  public async getShowtimes(filters: {
    movieId?: string;
    cinemaId?: string;
    date?: string;
  }): Promise<
    (ShowtimeRecord & {
      movie: MovieRecord;
      auditorium: AuditoriumRecord;
      cinema: CinemaRecord;
    })[]
  > {
    await this.initialize();
    let list = Array.from(this.showtimes.values()).filter((s) => s.isActive);

    if (filters.movieId) {
      list = list.filter((s) => s.movieId === filters.movieId);
    }

    if (filters.cinemaId) {
      list = list.filter((s) => {
        const aud = this.auditoriums.get(s.auditoriumId);
        return aud?.cinemaId === filters.cinemaId;
      });
    }

    if (filters.date) {
      const targetDate = new Date(filters.date).toDateString();
      list = list.filter(
        (s) => new Date(s.startTime).toDateString() === targetDate
      );
    }

    return list
      .map((st) => {
        const movie = this.movies.get(st.movieId)!;
        const auditorium = this.auditoriums.get(st.auditoriumId)!;
        const cinema = this.cinemas.get(auditorium.cinemaId)!;
        return {
          ...st,
          movie,
          auditorium,
          cinema,
        };
      })
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  public async getShowtimeWithDetails(showtimeId: string) {
    await this.initialize();
    // First, auto-release any expired holds on this showtime
    await this.releaseExpiredHolds();

    const showtime = this.showtimes.get(showtimeId);
    if (!showtime) return null;

    const movie = this.movies.get(showtime.movieId)!;
    const auditorium = this.auditoriums.get(showtime.auditoriumId)!;
    const cinema = this.cinemas.get(auditorium.cinemaId)!;

    const stSeats = Array.from(this.showtimeSeats.values()).filter(
      (sts) => sts.showtimeId === showtimeId
    );

    const enrichedSeats = stSeats.map((sts) => {
      const seat = this.seats.get(sts.seatId)!;
      let seatPriceCents = showtime.basePriceCents;
      if (seat.seatType === 'VIP') seatPriceCents += 600; // +$6.00
      if (seat.seatType === 'RECLINER') seatPriceCents += 1000; // +$10.00

      // Dynamic check for hold expiration
      let effectiveStatus = sts.status;
      if (
        sts.status === 'HELD' &&
        sts.heldUntil &&
        new Date(sts.heldUntil).getTime() < Date.now()
      ) {
        effectiveStatus = 'AVAILABLE';
      }

      return {
        showtimeSeatId: sts.id,
        seatId: seat.id,
        row: seat.row,
        number: seat.number,
        seatLabel: `${seat.row}${seat.number}`,
        seatType: seat.seatType,
        priceCents: seatPriceCents,
        status: effectiveStatus,
        heldUntil: sts.heldUntil,
      };
    });

    // Group seats by row for intuitive UI rendering
    const rowsMap = new Map<string, typeof enrichedSeats>();
    for (const s of enrichedSeats) {
      if (!rowsMap.has(s.row)) {
        rowsMap.set(s.row, []);
      }
      rowsMap.get(s.row)!.push(s);
    }

    for (const [, rowSeats] of rowsMap) {
      rowSeats.sort((a, b) => a.number - b.number);
    }

    return {
      showtime,
      movie,
      auditorium,
      cinema,
      seatRows: Array.from(rowsMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([row, seats]) => ({ row, seats })),
      allSeats: enrichedSeats,
    };
  }

  // --- 1. ATOMIC TRANSACTION: CREATE SEAT HOLD (10-minute hold TTL) ---
  public async createHoldBooking(params: {
    showtimeId: string;
    seatIds: string[];
    userId: string;
  }): Promise<{
    booking: BookingRecord;
    items: BookingItemRecord[];
    expiresAt: Date;
    totalAmountCents: number;
  }> {
    await this.initialize();
    if (!params.seatIds || params.seatIds.length === 0) {
      throw new Error('At least one seat must be selected');
    }

    if (params.seatIds.length > 10) {
      throw new Error('Maximum 10 seats allowed per booking transaction');
    }

    // Acquire atomic transaction lock for race-condition prevention
    const releaseLock = await this.acquireLock();

    try {
      // 1. Release any expired holds in system
      const now = new Date();
      for (const sts of this.showtimeSeats.values()) {
        if (
          sts.status === 'HELD' &&
          sts.heldUntil &&
          new Date(sts.heldUntil).getTime() < now.getTime()
        ) {
          sts.status = 'AVAILABLE';
          sts.heldUntil = null;
          sts.heldByBookingId = null;
          sts.version += 1;
        }
      }

      const showtime = this.showtimes.get(params.showtimeId);
      if (!showtime) {
        throw new Error('Showtime not found');
      }

      // 2. Lock & Verify all requested seats
      const targetStSeats: ShowtimeSeatRecord[] = [];
      const targetSeats: SeatRecord[] = [];

      for (const seatId of params.seatIds) {
        const sts = Array.from(this.showtimeSeats.values()).find(
          (s) => s.showtimeId === params.showtimeId && s.seatId === seatId
        );

        if (!sts) {
          throw new Error(`Showtime seat ${seatId} does not exist`);
        }

        const seat = this.seats.get(seatId);
        if (!seat) {
          throw new Error(`Seat ${seatId} not found`);
        }

        // Concurrency / Availability Check
        if (sts.status === 'BOOKED' || sts.status === 'BLOCKED') {
          throw new Error(
            `Seat ${seat.row}${seat.number} is already booked or blocked`
          );
        }

        if (
          sts.status === 'HELD' &&
          sts.heldUntil &&
          new Date(sts.heldUntil).getTime() >= now.getTime()
        ) {
          throw new Error(
            `Seat ${seat.row}${seat.number} is currently held by another guest`
          );
        }

        targetStSeats.push(sts);
        targetSeats.push(seat);
      }

      // 3. Server-side accurate pricing calculation (Integer cents)
      let subtotalCents = 0;
      const calculatedItems: {
        showtimeSeatId: string;
        seatId: string;
        priceCents: number;
        seatLabel: string;
      }[] = [];

      for (let i = 0; i < targetStSeats.length; i++) {
        const sts = targetStSeats[i];
        const seat = targetSeats[i];

        let itemPrice = showtime.basePriceCents;
        if (seat.seatType === 'VIP') itemPrice += 600;
        if (seat.seatType === 'RECLINER') itemPrice += 1000;

        subtotalCents += itemPrice;
        calculatedItems.push({
          showtimeSeatId: sts.id,
          seatId: seat.id,
          priceCents: itemPrice,
          seatLabel: `${seat.row}${seat.number}`,
        });
      }

      // Fee: $1.50 per seat
      const feeAmountCents = targetStSeats.length * 150;
      // Tax: 8% on subtotal
      const taxAmountCents = Math.round(subtotalCents * 0.08);
      const totalAmountCents = subtotalCents + feeAmountCents + taxAmountCents;

      // 4. Create 10-Minute Hold
      const holdDurationMs = 10 * 60 * 1000; // 10 minutes
      const expiresAt = new Date(now.getTime() + holdDurationMs);
      const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(4, 9)}`;
      const bookingReference = generateBookingReference();

      const booking: BookingRecord = {
        id: bookingId,
        bookingReference,
        userId: params.userId,
        showtimeId: params.showtimeId,
        subtotalCents,
        feeAmountCents,
        taxAmountCents,
        totalAmountCents,
        status: 'PENDING',
        expiresAt,
        createdAt: now,
        updatedAt: now,
      };

      this.bookings.set(booking.id, booking);

      // Create Booking Items & Update Showtime Seats status to HELD
      const createdItems: BookingItemRecord[] = [];
      for (const item of calculatedItems) {
        const itemId = `bki-${Date.now()}-${Math.random().toString(36).substring(4, 9)}`;
        const bookingItem: BookingItemRecord = {
          id: itemId,
          bookingId: booking.id,
          showtimeSeatId: item.showtimeSeatId,
          seatId: item.seatId,
          priceCents: item.priceCents,
          seatLabel: item.seatLabel,
          createdAt: now,
        };
        this.bookingItems.set(bookingItem.id, bookingItem);
        createdItems.push(bookingItem);

        // Update showtime seat to HELD
        const sts = this.showtimeSeats.get(item.showtimeSeatId)!;
        sts.status = 'HELD';
        sts.heldUntil = expiresAt;
        sts.heldByBookingId = booking.id;
        sts.version += 1;
        sts.updatedAt = now;
      }

      // Log Audit Trail
      this.auditLogs.push({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(4, 8)}`,
        userId: params.userId,
        action: 'HOLD_SEATS_CREATED',
        entityType: 'BOOKING',
        entityId: booking.id,
        metadata: JSON.stringify({
          bookingReference,
          seats: calculatedItems.map((i) => i.seatLabel),
          totalAmountCents,
          expiresAt,
        }),
        createdAt: now,
      });

      logger.info(`Seats held successfully for booking ${bookingReference}`, {
        bookingId: booking.id,
        seats: calculatedItems.map((i) => i.seatLabel).join(', '),
        totalAmount: formatCents(totalAmountCents),
      });

      return {
        booking,
        items: createdItems,
        expiresAt,
        totalAmountCents,
      };
    } finally {
      releaseLock();
    }
  }

  // --- 2. ATOMIC TRANSACTION: CONFIRM PAYMENT & ISSUE TICKETS ---
  public async confirmBookingPayment(params: {
    bookingId: string;
    userId?: string;
    paymentMethod: {
      type: 'card' | 'test_card' | 'stripe';
      cardNumber?: string;
      cardExpMonth?: string;
      cardExpYear?: string;
      cardCvc?: string;
      cardholderName?: string;
      testOutcome?: 'success' | 'decline' | 'insufficient_funds' | 'requires_3ds';
    };
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    booking: BookingRecord;
    tickets: TicketRecord[];
    payment: PaymentRecord;
    errorMessage?: string;
  }> {
    await this.initialize();
    const releaseLock = await this.acquireLock();

    try {
      const booking = this.bookings.get(params.bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      // Idempotency check: If already confirmed with same or previous key, return safely
      if (booking.status === 'CONFIRMED') {
        const existingPayment = Array.from(this.payments.values()).find(
          (p) => p.bookingId === booking.id && p.status === 'SUCCEEDED'
        );
        const existingTickets = Array.from(this.tickets.values()).filter(
          (t) => t.bookingId === booking.id
        );

        logger.info(`Idempotent payment confirmation returned for booking ${booking.bookingReference}`);
        return {
          success: true,
          booking,
          tickets: existingTickets,
          payment: existingPayment!,
        };
      }

      const now = new Date();

      // Check if hold has expired
      if (
        booking.status === 'EXPIRED' ||
        new Date(booking.expiresAt).getTime() < now.getTime()
      ) {
        booking.status = 'EXPIRED';
        throw new Error(
          'Your seat hold has expired. Please select seats again to complete booking.'
        );
      }

      // Process Payment through Payment Gateway
      const paymentResult = await processPayment({
        bookingId: booking.id,
        userId: booking.userId,
        amountCents: booking.totalAmountCents,
        paymentMethod: params.paymentMethod,
        idempotencyKey: params.idempotencyKey,
      });

      // Record Payment Record
      const paymentId = `pay-${Date.now()}-${Math.random().toString(36).substring(4, 8)}`;
      const paymentRecord: PaymentRecord = {
        id: paymentId,
        bookingId: booking.id,
        userId: booking.userId,
        amountCents: booking.totalAmountCents,
        currency: 'USD',
        provider: paymentResult.provider,
        providerTransactionId: paymentResult.providerTransactionId,
        providerPaymentIntentId: paymentResult.providerPaymentIntentId,
        idempotencyKey: paymentResult.idempotencyKey,
        status: paymentResult.status,
        errorMessage: paymentResult.errorMessage,
        createdAt: now,
        updatedAt: now,
      };

      this.payments.set(paymentRecord.id, paymentRecord);

      if (!paymentResult.success) {
        this.auditLogs.push({
          id: `aud-${Date.now()}`,
          userId: booking.userId,
          action: 'PAYMENT_FAILED',
          entityType: 'PAYMENT',
          entityId: paymentRecord.id,
          metadata: JSON.stringify({
            error: paymentResult.errorMessage,
            bookingId: booking.id,
          }),
          createdAt: now,
        });

        return {
          success: false,
          booking,
          tickets: [],
          payment: paymentRecord,
          errorMessage: paymentResult.errorMessage || 'Payment was declined.',
        };
      }

      // 5. Payment Succeeded -> Transition Booking to CONFIRMED & Seats to BOOKED
      booking.status = 'CONFIRMED';
      booking.idempotencyKey = paymentResult.idempotencyKey;
      booking.updatedAt = now;

      // Lock seats permanently to BOOKED
      const items = Array.from(this.bookingItems.values()).filter(
        (bi) => bi.bookingId === booking.id
      );

      const showtime = this.showtimes.get(booking.showtimeId)!;
      const movie = this.movies.get(showtime.movieId)!;
      const auditorium = this.auditoriums.get(showtime.auditoriumId)!;
      const cinema = this.cinemas.get(auditorium.cinemaId)!;

      const createdTickets: TicketRecord[] = [];

      for (const item of items) {
        const sts = this.showtimeSeats.get(item.showtimeSeatId);
        if (sts) {
          sts.status = 'BOOKED';
          sts.heldUntil = null;
          sts.version += 1;
          sts.updatedAt = now;
        }

        // Generate Ticket & Cryptographically Signed QR payload
        const seat = this.seats.get(item.seatId)!;
        const ticketCode = generateTicketCode(seat.row, seat.number);

        const qrPayload = signTicketPayload({
          ticketCode,
          bookingReference: booking.bookingReference,
          showtimeId: showtime.id,
          seatLabel: item.seatLabel,
          movieTitle: movie.title,
          auditoriumName: auditorium.name,
          cinemaName: cinema.name,
          showtime: showtime.startTime.toISOString(),
          timestamp: now.toISOString(),
        });

        const ticketId = `tck-${Date.now()}-${Math.random().toString(36).substring(4, 9)}`;
        const ticket: TicketRecord = {
          id: ticketId,
          bookingId: booking.id,
          bookingItemId: item.id,
          ticketCode,
          qrCodeData: qrPayload,
          isUsed: false,
          usedAt: null,
          createdAt: now,
        };

        this.tickets.set(ticket.id, ticket);
        createdTickets.push(ticket);
      }

      // Audit Log
      this.auditLogs.push({
        id: `aud-${Date.now()}-${Math.random().toString(36).substring(4, 8)}`,
        userId: booking.userId,
        action: 'BOOKING_CONFIRMED_AND_TICKETS_ISSUED',
        entityType: 'BOOKING',
        entityId: booking.id,
        metadata: JSON.stringify({
          bookingReference: booking.bookingReference,
          ticketCount: createdTickets.length,
          paymentId: paymentRecord.id,
          transactionId: paymentResult.providerTransactionId,
        }),
        createdAt: now,
      });

      logger.info(`Booking ${booking.bookingReference} confirmed! ${createdTickets.length} tickets minted.`);

      return {
        success: true,
        booking,
        tickets: createdTickets,
        payment: paymentRecord,
      };
    } finally {
      releaseLock();
    }
  }

  // --- 3. ATOMIC TRANSACTION: CANCEL BOOKING ---
  public async cancelBooking(
    bookingId: string,
    userId: string,
    isAdmin = false
  ): Promise<{ success: boolean; booking: BookingRecord; message: string }> {
    await this.initialize();
    const releaseLock = await this.acquireLock();

    try {
      const booking = this.bookings.get(bookingId);
      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!isAdmin && booking.userId !== userId) {
        throw new Error('Unauthorized: You cannot cancel another user’s booking');
      }

      if (booking.status === 'CANCELLED') {
        return { success: true, booking, message: 'Booking is already cancelled' };
      }

      if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
        throw new Error(`Cannot cancel booking with status: ${booking.status}`);
      }

      const showtime = this.showtimes.get(booking.showtimeId);
      if (showtime) {
        const showtimeTime = new Date(showtime.startTime).getTime();
        const twoHoursBefore = showtimeTime - 2 * 3600 * 1000;
        if (!isAdmin && Date.now() > twoHoursBefore) {
          throw new Error(
            'Bookings can only be cancelled up to 2 hours before showtime.'
          );
        }
      }

      const now = new Date();
      booking.status = 'CANCELLED';
      booking.cancelledAt = now;
      booking.updatedAt = now;

      // Release all showtime seats
      const items = Array.from(this.bookingItems.values()).filter(
        (bi) => bi.bookingId === booking.id
      );

      for (const item of items) {
        const sts = this.showtimeSeats.get(item.showtimeSeatId);
        if (sts) {
          sts.status = 'AVAILABLE';
          sts.heldUntil = null;
          sts.heldByBookingId = null;
          sts.version += 1;
          sts.updatedAt = now;
        }
      }

      // Record refund payment status if was paid
      const payment = Array.from(this.payments.values()).find(
        (p) => p.bookingId === booking.id && p.status === 'SUCCEEDED'
      );
      if (payment) {
        payment.status = 'REFUNDED';
        payment.updatedAt = now;
      }

      this.auditLogs.push({
        id: `aud-${Date.now()}`,
        userId,
        action: 'BOOKING_CANCELLED',
        entityType: 'BOOKING',
        entityId: booking.id,
        metadata: JSON.stringify({
          bookingReference: booking.bookingReference,
          cancelledBy: isAdmin ? 'ADMIN' : 'CUSTOMER',
        }),
        createdAt: now,
      });

      logger.info(`Booking ${booking.bookingReference} cancelled & seats released.`);

      return {
        success: true,
        booking,
        message: 'Your booking was successfully cancelled and seats released.',
      };
    } finally {
      releaseLock();
    }
  }

  // --- 4. IDEMPOTENT CRON CLEANUP: RELEASE EXPIRED HOLDS ---
  public async releaseExpiredHolds(): Promise<{
    releasedSeatsCount: number;
    expiredBookingsCount: number;
  }> {
    const releaseLock = await this.acquireLock();
    try {
      const now = new Date();
      let releasedSeatsCount = 0;
      let expiredBookingsCount = 0;

      // 1. Clean expired showtime seats
      for (const sts of this.showtimeSeats.values()) {
        if (
          sts.status === 'HELD' &&
          sts.heldUntil &&
          new Date(sts.heldUntil).getTime() < now.getTime()
        ) {
          sts.status = 'AVAILABLE';
          sts.heldUntil = null;
          sts.heldByBookingId = null;
          sts.version += 1;
          sts.updatedAt = now;
          releasedSeatsCount++;
        }
      }

      // 2. Mark pending bookings as expired
      for (const booking of this.bookings.values()) {
        if (
          booking.status === 'PENDING' &&
          new Date(booking.expiresAt).getTime() < now.getTime()
        ) {
          booking.status = 'EXPIRED';
          booking.updatedAt = now;
          expiredBookingsCount++;
        }
      }

      if (releasedSeatsCount > 0 || expiredBookingsCount > 0) {
        this.auditLogs.push({
          id: `aud-${Date.now()}`,
          action: 'RELEASE_EXPIRED_HOLDS_CRON',
          entityType: 'CRON_JOB',
          entityId: 'release-holds',
          metadata: JSON.stringify({ releasedSeatsCount, expiredBookingsCount }),
          createdAt: now,
        });

        logger.info(
          `Cron executed: Released ${releasedSeatsCount} expired seats and updated ${expiredBookingsCount} expired bookings.`
        );
      }

      return { releasedSeatsCount, expiredBookingsCount };
    } finally {
      releaseLock();
    }
  }

  // --- BOOKING RETRIEVAL & VERIFICATION ---
  public async getBookingDetails(bookingIdOrRef: string, requestingUserId?: string, isAdmin = false) {
    await this.initialize();
    await this.releaseExpiredHolds();

    const booking =
      this.bookings.get(bookingIdOrRef) ||
      Array.from(this.bookings.values()).find(
        (b) => b.bookingReference === bookingIdOrRef
      );

    if (!booking) return null;

    if (requestingUserId && !isAdmin && booking.userId !== requestingUserId) {
      throw new Error('Access denied to requested booking');
    }

    const showtime = this.showtimes.get(booking.showtimeId)!;
    const movie = this.movies.get(showtime.movieId)!;
    const auditorium = this.auditoriums.get(showtime.auditoriumId)!;
    const cinema = this.cinemas.get(auditorium.cinemaId)!;

    const items = Array.from(this.bookingItems.values()).filter(
      (bi) => bi.bookingId === booking.id
    );

    const tickets = Array.from(this.tickets.values()).filter(
      (t) => t.bookingId === booking.id
    );

    const payment = Array.from(this.payments.values()).find(
      (p) => p.bookingId === booking.id
    );

    const user = this.users.get(booking.userId);

    return {
      booking,
      showtime,
      movie,
      auditorium,
      cinema,
      items,
      tickets,
      payment,
      user: user
        ? { id: user.id, email: user.email, fullName: user.fullName }
        : null,
    };
  }

  public async getUserBookings(userId: string) {
    await this.initialize();
    const userBookings = Array.from(this.bookings.values())
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const enriched = [];
    for (const b of userBookings) {
      const details = await this.getBookingDetails(b.id, userId, false);
      if (details) enriched.push(details);
    }
    return enriched;
  }

  public async verifyAndCheckInTicket(ticketCode: string): Promise<{
    success: boolean;
    ticket?: TicketRecord;
    details?: any;
    error?: string;
  }> {
    await this.initialize();
    const ticket = Array.from(this.tickets.values()).find(
      (t) => t.ticketCode === ticketCode
    );

    if (!ticket) {
      return { success: false, error: 'Ticket code not found' };
    }

    if (ticket.isUsed) {
      return {
        success: false,
        ticket,
        error: `Ticket was already used at ${ticket.usedAt?.toLocaleString()}`,
      };
    }

    const now = new Date();
    ticket.isUsed = true;
    ticket.usedAt = now;

    const details = await this.getBookingDetails(ticket.bookingId, undefined, true);

    this.auditLogs.push({
      id: `aud-${Date.now()}`,
      action: 'TICKET_CHECK_IN',
      entityType: 'TICKET',
      entityId: ticket.id,
      metadata: JSON.stringify({
        ticketCode,
        bookingRef: details?.booking.bookingReference,
      }),
      createdAt: now,
    });

    return { success: true, ticket, details };
  }

  // --- ADMIN STATS & CONTROL ---
  public async getAdminStats() {
    await this.initialize();
    const allBookings = Array.from(this.bookings.values());
    const confirmedBookings = allBookings.filter((b) => b.status === 'CONFIRMED');

    const totalRevenueCents = confirmedBookings.reduce(
      (acc, b) => acc + b.totalAmountCents,
      0
    );

    const totalTicketsSold = Array.from(this.tickets.values()).length;
    const totalMovies = Array.from(this.movies.values()).length;
    const totalShowtimes = Array.from(this.showtimes.values()).length;

    const allSeatsCount = Array.from(this.showtimeSeats.values()).length;
    const bookedSeatsCount = Array.from(this.showtimeSeats.values()).filter(
      (s) => s.status === 'BOOKED'
    ).length;

    const occupancyRate =
      allSeatsCount > 0 ? Math.round((bookedSeatsCount / allSeatsCount) * 100) : 0;

    return {
      totalRevenueCents,
      totalRevenueFormatted: formatCents(totalRevenueCents),
      totalBookingsCount: confirmedBookings.length,
      totalTicketsSold,
      totalMovies,
      totalShowtimes,
      occupancyRate,
      recentBookings: allBookings
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10),
    };
  }

  public async getAdminAuditLogs() {
    await this.initialize();
    return this.auditLogs.slice(-50).reverse();
  }
}

// Global Singleton Instance
declare global {
  // eslint-disable-next-line no-var
  var __CINEBOOK_STORE__: CineBookStore | undefined;
}

export const store = globalThis.__CINEBOOK_STORE__ || new CineBookStore();
if (process.env.NODE_ENV !== 'production') {
  globalThis.__CINEBOOK_STORE__ = store;
}
