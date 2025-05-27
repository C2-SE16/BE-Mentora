import { approve_enum } from "@prisma/client";

export const COURSE_APPROVE_STATUS = {
  APPROVED: 'APPROVED' as approve_enum,
  PENDING: 'PENDING' as approve_enum,
  REJECTED: 'REJECTED' as approve_enum,
};
