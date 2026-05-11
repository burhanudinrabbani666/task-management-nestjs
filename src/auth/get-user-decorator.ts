import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from './user.entity';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest<Request & { user: User }>(); // semua properti Express Request + tambahan property user: User
    return req.user;
  },
);
