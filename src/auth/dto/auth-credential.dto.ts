import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AuthCredentialDto {
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @IsString()
  username!: string;

  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @IsString()
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password is to week',
  })
  password!: string;
}
