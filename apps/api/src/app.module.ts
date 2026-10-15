import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { NeighborhoodsModule } from './modules/neighborhoods/neighborhoods.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ListingsModule } from './modules/listings/listings.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { ProvidersModule } from './modules/providers/providers.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ChatModule } from './modules/chat/chat.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { ExchangesModule } from './modules/exchanges/exchanges.module';
import { MatchingModule } from './modules/matching/matching.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    NeighborhoodsModule,
    CategoriesModule,
    ListingsModule,
    AvailabilityModule,
    ProvidersModule,
    WalletModule,
    NotificationsModule,
    ChatModule,
    BookingsModule,
    ReviewsModule,
    DisputesModule,
    ExchangesModule,
    MatchingModule,
    AnalyticsModule,
  ],
  // RolesGuard is applied per route with @UseGuards(...RolesGuard) after JwtAuthGuard.
  // Registering it globally (APP_GUARD) made it run before authentication, so
  // req.user was empty and every @Roles(ADMIN) route returned 403.
  controllers: [],
  providers: [],
})
export class AppModule {}
