// src/firebase/firebase.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly androidChannelId = 'radioyeraz-updates';
  private readonly androidNotificationColor = '#D71920';
  private readonly androidNotificationIcon = 'ic_notification';

  onModuleInit() {
    if (admin.apps.length) {
      return;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!projectId || !clientEmail || !privateKey) {
      this.logger.error(
        'Firebase config missing. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY',
      );
      return;
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      this.logger.log(`Firebase initialized for project: ${projectId}`);
    } catch (error) {
      this.logger.error(
        `Firebase initialization failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private ensureInitialized() {
    if (!admin.apps.length) {
      throw new Error('Firebase app is not initialized');
    }
  }

  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    this.ensureInitialized();
    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          channelId: this.androidChannelId,
          color: this.androidNotificationColor,
          icon: this.androidNotificationIcon,
          sound: 'default',
        },
      },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    const messageId = await admin.messaging().send(message);
    this.logger.log(`Sent device notification: ${messageId}`);
    return messageId;
  }

  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
  ): Promise<admin.messaging.BatchResponse> {
    this.ensureInitialized();
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    this.logger.log(
      `Sent multicast notification. Success: ${response.successCount}, Failure: ${response.failureCount}`,
    );
    return response;
  }

  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    this.ensureInitialized();
    const message: admin.messaging.Message = {
      topic,
      notification: { title, body },
      data,
      android: {
        priority: 'high',
        notification: {
          title,
          body,
          channelId: this.androidChannelId,
          color: this.androidNotificationColor,
          icon: this.androidNotificationIcon,
          sound: 'default',
        },
      },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    const messageId = await admin.messaging().send(message);
    this.logger.log(`Sent topic notification to "${topic}": ${messageId}`);
    return messageId;
  }

  async subscribeTokenToTopic(
    token: string,
    topic: string,
  ): Promise<admin.messaging.MessagingTopicManagementResponse> {
    this.ensureInitialized();
    const response = await admin.messaging().subscribeToTopic([token], topic);
    this.logger.log(
      `Subscribed token to "${topic}". Success: ${response.successCount}, Failure: ${response.failureCount}`,
    );
    return response;
  }
}
