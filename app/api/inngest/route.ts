import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { type NextRequest } from 'next/server';

const handler = serve({ client: inngest, functions: [] });

export function GET(req: NextRequest) { return handler.GET(req, undefined); }
export function POST(req: NextRequest) { return handler.POST(req, undefined); }
export function PUT(req: NextRequest) { return handler.PUT(req, undefined); }
