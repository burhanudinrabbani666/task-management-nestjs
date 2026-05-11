import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, JwtResponse } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersRepository: UserRepository,
    private jwtService: JwtService,
  ) {}

  public signUp(authCreadential: AuthCredentialDto): Promise<void> {
    return this.usersRepository.createNewUser(authCreadential);
  }

  async signIn(authCredentialDto: AuthCredentialDto): Promise<JwtResponse> {
    const { username, password } = authCredentialDto;
    const user = await this.usersRepository.findOne({ where: { username } });

    if (user && (await bcrypt.compare(password, user.password))) {
      const payload: JwtPayload = { username };
      const jwtRespone: JwtResponse = {
        accessToken: this.jwtService.sign(payload),
      };

      return jwtRespone;
    }

    throw new UnauthorizedException('Please Check You login Credentials');
  }
}
