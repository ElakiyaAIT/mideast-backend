import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '../../../common/config/config.service';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App | null = null;

  constructor(private configService: ConfigService) {
    this.initializeFirebase();
  }

  private initializeFirebase(): void {
    try {
      const firebaseConfig = this.configService.getFirebaseConfig();

      if (!firebaseConfig) {
        this.logger.warn('Firebase configuration not found. Google Sign In disabled.');
        return;
      }

      const { projectId, clientEmail, privateKey } = firebaseConfig;

      if (!projectId || !clientEmail || !privateKey) {
        this.logger.warn('Incomplete Firebase config. Google Sign In disabled.');
        return;
      }

      const credential = admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      });

      this.app = admin.initializeApp({
        credential,
        projectId,
      });

      this.logger.log('Firebase Admin initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin', error);
    }
  }

  /**
   * Verify Firebase ID token and return decoded token
   */
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.app) {
      throw new UnauthorizedException('Firebase is not configured');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      this.logger.error('Firebase token verification failed', error);
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }

  /**
   * Get Firebase user by UID
   */
  async getUserByUid(uid: string): Promise<admin.auth.UserRecord> {
    if (!this.app) {
      throw new UnauthorizedException('Firebase is not configured');
    }

    try {
      const user = await admin.auth().getUser(uid);
      return user;
    } catch (error) {
      this.logger.error(`Failed to get Firebase user by UID: ${uid}`, error);
      throw new UnauthorizedException('Firebase user not found');
    }
  }
}
