import { AuthUser } from '../modules/auth/interfaces/auth-user.interface';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
