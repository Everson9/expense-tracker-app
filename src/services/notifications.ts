import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyReminder(hour = 20, minute = 0): Promise<string | null> {
  try {
    const granted = await requestPermission();
    if (!granted) return null;

    await cancelDailyReminder();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💸 Organizador de Gastos',
        body: 'Não esquece de registrar seus gastos de hoje!',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    return id;
  } catch {
    return null;
  }
}

export async function cancelDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
}

export async function getScheduledReminder(): Promise<Notifications.ScheduledNotificationTrigger | null> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.length > 0 ? (scheduled[0].trigger as any) : null;
}
