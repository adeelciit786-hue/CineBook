import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/db/store';
import { hashPassword, createSessionToken, SESSION_COOKIE_OPTIONS } from '@/lib/auth';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    await store.initialize();
    const body = await req.json();
    const { email, password, fullName, phone } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const existing = Array.from(store.users.values()).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = `u-user-${Date.now()}`;

    const newUser = {
      id: userId,
      email: email.toLowerCase(),
      passwordHash,
      fullName,
      phone: phone || undefined,
      role: 'CUSTOMER' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.users.set(newUser.id, newUser);

    const sessionUser = {
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
    };

    const token = await createSessionToken(sessionUser);

    logger.info(`New user registered: ${newUser.email}`);

    const response = NextResponse.json(
      {
        success: true,
        user: sessionUser,
        token,
      },
      { status: 201 }
    );

    response.cookies.set(
      SESSION_COOKIE_OPTIONS.name,
      token,
      SESSION_COOKIE_OPTIONS
    );

    return response;
  } catch (err: any) {
    logger.error('Registration error:', err);
    return NextResponse.json(
      { error: err.message || 'Registration failed' },
      { status: 500 }
    );
  }
}
