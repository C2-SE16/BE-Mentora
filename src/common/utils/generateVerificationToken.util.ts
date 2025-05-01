import { randomBytes } from 'crypto';

export const generateVerificationToken = () => {
  return randomBytes(32).toString('hex');
};
