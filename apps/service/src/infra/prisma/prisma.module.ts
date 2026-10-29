import { prismaAuth, prismaMyCarTracker } from '@lib/my-car-tracker-db'
import { Global, Module } from '@nestjs/common'

const MyCarTrackerProvider = {
  provide: 'prismaMyCarTracker',
  useValue: prismaMyCarTracker
}

const AuthProvider = {
  provide: 'prismaAuth',
  useValue: prismaAuth
}

@Global()
@Module({
  providers: [MyCarTrackerProvider, AuthProvider],
  exports: [MyCarTrackerProvider, AuthProvider]
})
export class PrismaModule {}
