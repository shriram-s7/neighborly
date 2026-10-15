import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@neighborly/shared';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppModule } from '../../app.module';

const ctxFor = (user: any): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  }) as unknown as ExecutionContext;

describe('Admin route authorisation (RolesGuard)', () => {
  const reflector = new Reflector();
  jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) =>
    key === ROLES_KEY ? [Role.ADMIN] : undefined,
  );
  const guard = new RolesGuard(reflector);

  it('should allow an authenticated ADMIN and reject a USER on @Roles(ADMIN) routes', () => {
    expect(guard.canActivate(ctxFor({ sub: 'a1', role: Role.ADMIN }))).toBe(true);
    expect(() => guard.canActivate(ctxFor({ sub: 'u1', role: Role.USER }))).toThrow(ForbiddenException);
  });

  it('should not be registered as a global guard (it would run before JwtAuthGuard and 403 every admin)', () => {
    const providers: any[] = Reflect.getMetadata('providers', AppModule) || [];
    const globalGuards = providers.filter((p) => p && p.provide === 'APP_GUARD');
    expect(globalGuards).toHaveLength(0);
  });
});
