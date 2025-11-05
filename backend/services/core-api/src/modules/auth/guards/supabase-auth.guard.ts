import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { SupabaseService } from '../../../integrations/supabase/supabase.service';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    const client = this.supabaseService.getClient();
    const { data, error } = await client.auth.getUser(token);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid or expired authentication token.');
    }

    request.user = this.mapUser(data.user);
    return true;
  }

  private extractToken(request: FastifyRequest): string {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing Bearer authorization header.');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid Bearer authorization header.');
    }

    return token;
  }

  private mapUser(user: { id: string; email?: string; app_metadata?: Record<string, unknown> }): AuthUser {
    const roles = Array.isArray(user.app_metadata?.roles)
      ? (user.app_metadata?.roles as string[])
      : [];

    return {
      id: user.id,
      email: user.email ?? undefined,
      roles,
    };
  }
}
