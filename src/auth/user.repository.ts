import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository, DataSource, QueryFailedError } from 'typeorm';
import { User } from './user.entity';
import { AuthCredentialDto } from './dto/auth-credential.dto';
import * as bcrypt from 'bcrypt';

interface PostgresError {
  code: string;
  detail?: string;
  constraint?: string;
}

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  public async createNewUser(
    authCredentialDto: AuthCredentialDto,
  ): Promise<void> {
    try {
      const { username, password } = authCredentialDto;

      // Hash
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = this.create({ username, password: hashedPassword });
      await this.save(newUser);
      //
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const pgError = error.driverError as PostgresError;
        if (pgError.code === '23505') {
          throw new ConflictException('Username already Exist');
        }
      }
      throw new InternalServerErrorException();
    }
  }
}
