import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract current user from request
 * Used with authentication guards to access user information in controllers
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
