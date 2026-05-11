import { Injectable } from '@nestjs/common';
import { Repository, DataSource } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialDto } from './dto/auth-credential.dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  public async createNewUser(
    authCredentialDto: AuthCredentialDto,
  ): Promise<void> {
    const { username, password } = authCredentialDto;
    const newUser = this.create({
      username,
      password,
    });
    await this.save(newUser);
  }
}
