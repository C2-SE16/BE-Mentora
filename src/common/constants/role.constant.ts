import { role_enum } from "@prisma/client";

export const ROLE = {
  ADMIN: 'ADMIN' as role_enum,
  INSTRUCTOR: 'INSTRUCTOR' as role_enum,
  STUDENT: 'STUDENT' as role_enum,
  SUPPORT_STAFF: 'SUPPORT_STAFF' as role_enum,
  ANONYMOUS: 'ANONYMOUS' as role_enum,
};
