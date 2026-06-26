import { randomBytes } from 'crypto';

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

export function createObjectIdString(): string {
  return randomBytes(12).toString('hex');
}

export function isObjectIdString(id: string): boolean {
  return OBJECT_ID_PATTERN.test(id);
}
