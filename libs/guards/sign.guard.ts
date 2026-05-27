import * as crypto from 'crypto';

export function validateSignature(
  body: Record<string, any>,
  secretKey: string,
): boolean {
  const { sign, ...rest } = body;

  const primitiveKeys = Object.keys(rest)
    .filter((key) => {
      const val = rest[key];
      return val !== null && typeof val !== 'object';
    })
    .sort();
  const hashString = primitiveKeys.map((key) => rest[key]).join('') + secretKey;

  const calculated = crypto.createHash('sha1').update(hashString).digest('hex');

  return calculated === sign;
}
