import type { Prisma } from '@lib/my-car-tracker-db'

import { User } from '../../domain/user.entity'

export class PrismaUserMapper {
  static toDomain(raw: Prisma.UserGetPayload<{}>): User {
    return new User({
      id: raw.id,
      name: raw.name,
      email: raw.email,
      emailVerified: raw.emailVerified,
      image: raw.image ?? null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt
    })
  }
}
