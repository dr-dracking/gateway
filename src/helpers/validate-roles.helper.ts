import { Role } from 'src/auth';

export const hasRoles = (userRoles: Role[], validRoles: Role[]) => {
  return userRoles.some((role) => validRoles.includes(role));
};
