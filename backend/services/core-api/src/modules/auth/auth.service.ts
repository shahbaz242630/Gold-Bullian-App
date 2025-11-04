import { BadRequestException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { AuthError } from '@supabase/supabase-js';
import { User } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

import { UsersService } from '../users/users.service';
import { SupabaseService } from '../../integrations/supabase/supabase.service';
import { UserEntity } from '../users/entities/user.entity';
import { RegisterRequestDto } from './dto/register-request.dto';
import { LoginRequestDto } from './dto/login-request.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly usersService: UsersService,
  ) {}

  async register(payload: RegisterRequestDto): Promise<AuthResponseDto> {
    if (!payload.acceptedTerms) {
      throw new BadRequestException('Terms and conditions must be accepted.');
    }

    const adminClient = this.supabaseService.getClient();

    const { data, error } = await adminClient.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      phone: payload.phoneNumber,
      user_metadata: {
        firstName: payload.firstName,
        lastName: payload.lastName,
        countryCode: payload.countryCode,
      },
      email_confirm: true,
    });

    this.assertNoSupabaseError(error);

    const supabaseUser = data.user;
    if (!supabaseUser) {
      throw new InternalServerErrorException('Supabase did not return a user.');
    }

    try {
      const user = await this.usersService.createWithDefaults({
        supabaseUid: supabaseUser.id,
        email: supabaseUser.email ?? undefined,
        phoneNumber: supabaseUser.phone ?? undefined,
        firstName: payload.firstName,
        lastName: payload.lastName,
        countryCode: payload.countryCode,
      });

      const session = await this.signInWithSupabase(payload.email, payload.password);

      return this.buildAuthResponse(session.access_token, session.refresh_token, session.token_type, session.expires_in, user);
    } catch (err) {
      await adminClient.auth.admin.deleteUser(supabaseUser.id);
      throw err;
    }
  }

  async login(payload: LoginRequestDto): Promise<AuthResponseDto> {
    const session = await this.signInWithSupabase(payload.email, payload.password);
    const supabaseUser = session.user;

    if (!supabaseUser) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    let user = await this.usersService.findBySupabaseUid(supabaseUser.id);

    if (!user) {
      user = await this.usersService.createWithDefaults({
        supabaseUid: supabaseUser.id,
        email: supabaseUser.email ?? undefined,
        phoneNumber: supabaseUser.phone ?? undefined,
        firstName: supabaseUser.user_metadata?.firstName,
        lastName: supabaseUser.user_metadata?.lastName,
        countryCode: supabaseUser.user_metadata?.countryCode,
      });
    }

    return this.buildAuthResponse(
      session.access_token,
      session.refresh_token,
      session.token_type,
      session.expires_in,
      user,
    );
  }

  private async signInWithSupabase(email: string, password: string) {
    const adminClient = this.supabaseService.getClient();
    const { data, error } = await adminClient.auth.signInWithPassword({ email, password });
    this.assertNoSupabaseError(error);

    if (!data.session) {
      throw new UnauthorizedException('Unable to retrieve session.');
    }

    return data.session;
  }

  private buildAuthResponse(
    accessToken: string,
    refreshToken: string,
    tokenType: string,
    expiresIn: number,
    userModel: User,
  ): AuthResponseDto {
    if (!refreshToken) {
      throw new InternalServerErrorException('Session is missing refresh token.');
    }

    const user = plainToInstance(UserEntity, UserEntity.fromModel(userModel), {
      excludeExtraneousValues: true,
    });

    return plainToInstance(
      AuthResponseDto,
      {
        accessToken,
        refreshToken,
        tokenType,
        expiresIn,
        user,
      },
      { excludeExtraneousValues: true },
    );
  }

  private assertNoSupabaseError(error: AuthError | null) {
    if (!error) {
      return;
    }

    if (error.status === 400) {
      throw new BadRequestException(error.message);
    }

    if (error.status === 401) {
      throw new UnauthorizedException(error.message);
    }

    throw new InternalServerErrorException(error.message);
  }
}



