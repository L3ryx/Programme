import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { databases, DATABASE_ID, COLLECTION_PUSH_TOKENS, ID } from './appwrite';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#7c3aed',
      sound: 'default',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function savePushToken(userId: string, token: string) {
  try {
    // Tente de mettre à jour le document existant
    await databases.updateDocument(
      DATABASE_ID,
      COLLECTION_PUSH_TOKENS,
      userId,
      { token, updated_at: new Date().toISOString() }
    );
  } catch {
    // S'il n'existe pas encore, on le crée (avec $id = userId pour upsert facile)
    try {
      await databases.createDocument(
        DATABASE_ID,
        COLLECTION_PUSH_TOKENS,
        userId,
        { user_id: userId, token, updated_at: new Date().toISOString() }
      );
    } catch (e) {
      console.warn('[notifications] savePushToken error', e);
    }
  }
}

export function scheduleLocalNotification(title: string, body: string) {
  Notifications.scheduleNotificationAsync({
    content: { title, body, sound: 'default' },
    trigger: null,
  });
}
