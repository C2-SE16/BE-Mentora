import { Exclude } from 'class-transformer';
import { role_enum } from '@prisma/client';

export class UserProfileEntity {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatar: string | null;
  role: role_enum | null;
  title: string | null;
  description: string | null;
  websiteLink: string | null;
  facebookLink: string | null;
  youtubeLink: string | null;
  linkedinLink: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;

  @Exclude()
  password: string | null;

  constructor(partial: Partial<UserProfileEntity>) {
    Object.assign(this, partial);
  }
}
