import { scrypt, randomBytes, timingSafeEqual } from 'crypto';

export class PasswordHelper {
  private static readonly SALT_LENGTH = 32; // 32 bytes = 256 bits
  private static readonly KEY_LENGTH = 64; // 64 bytes = 512 bits
  private static readonly COST = 16384; // CPU/memory cost parameter (N)

  private static async scryptWithOptions(
    password: string,
    salt: Buffer,
    keyLength: number,
    cost: number,
  ): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      scrypt(password, salt, keyLength, { N: cost }, (err, derivedKey) => {
        if (err) {
          reject(err);
        } else {
          resolve(derivedKey);
        }
      });
    });
  }

  static async hash(password: string): Promise<string> {
    const salt = randomBytes(this.SALT_LENGTH);
    const derivedKey = await this.scryptWithOptions(password, salt, this.KEY_LENGTH, this.COST);

    // Format: salt:key (both base64 encoded)
    return `${salt.toString('base64')}:${derivedKey.toString('base64')}`;
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    try {
      const [saltBase64, keyBase64] = hash.split(':');

      if (!saltBase64 || !keyBase64) {
        return false;
      }

      const salt = Buffer.from(saltBase64, 'base64');
      const storedKey = Buffer.from(keyBase64, 'base64');

      const derivedKey = await this.scryptWithOptions(password, salt, this.KEY_LENGTH, this.COST);

      // Use timing-safe comparison to prevent timing attacks
      if (derivedKey.length !== storedKey.length) {
        return false;
      }

      return timingSafeEqual(derivedKey, storedKey);
    } catch {
      return false;
    }
  }

  static validateStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
