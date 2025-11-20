import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User decorator
 * Extract authenticated user from request
 *
 * Usage:
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 *
 * Or to get specific property:
 * @Get('profile')
 * getProfile(@CurrentUser('email') email: string) {
 *   return email;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
