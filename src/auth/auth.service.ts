import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { AuthCredentialDto } from './dto/auth-credential.dto';

@Injectable()
export class AuthService {
  constructor(private usersRepository: UserRepository) {}

  public signUp(authCreadential: AuthCredentialDto): Promise<void> {
    return this.usersRepository.createNewUser(authCreadential);
  }
}
