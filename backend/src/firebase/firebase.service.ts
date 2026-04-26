// src/firebase/firebase.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { BatchResponse } from 'firebase-admin/messaging';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    // Prevent re-initialization on hot reload
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }

  // Send to a single device token
  async sendToDevice(token: string, title: string, body: string, data?: Record<string, string>) {
    const message: admin.messaging.Message = {
      token,
      notification: { title, body },
      data,
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    };
    return admin.messaging().send(message);
  }

  // Send to multiple device tokens
 async sendToMultipleDevices(
  tokens: string[],
  title: string,
  body: string
): Promise<admin.messaging.BatchResponse> {
  const message: admin.messaging.MulticastMessage = {
    tokens,
    notification: { title, body },
  };

  return admin.messaging().sendEachForMulticast(message);
}
  // Send to a topic (e.g., "emergency-alerts")
  async sendToTopic(topic: string, title: string, body: string, data?: Record<string, string>) {
    console.log('Init The Message');
    const message: admin.messaging.Message = {
      topic,
      notification: { title, body },
      data,
      android:{
         priority: 'high',
         notification : {
          title,                    
          body,
         }
      }
      
    };
    return admin.messaging().send(message);
  }
}