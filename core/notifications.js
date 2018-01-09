// Functions for sending push notifications
// @flow
import Expo from 'exponent-server-sdk';
import ConnUtils from './data/conn';
import DAO from './data/DAO';

export const sendPushesIfActiveAsync = async (
  message: string,
  conn: ConnUtils.DBConn,
  allUserIds: Array<number>,
  roundStarted: number,
): Promise<void> => {

  // Filter allUserIds to get a list of push tokens for
  // users with apps active since the round started, but
  // not active in the past 2 sec.
  const pushTokens = await DAO.getPushTokensAsync(
    conn,
    allUserIds,
    roundStarted,
    Date.now() - 2000,
  );

  if (pushTokens.length === 0) {
    return;
  }

  // Create a new Expo SDK client
  const expo = new Expo();

  // Create the messages that you want to send to clents
  let messages = [];
  for (let pushToken of pushTokens) {
    // Check that all your push tokens appear to be valid Expo push tokens
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      sound: 'default',
      body: message,
      data: {},
      title: 'My Reaction When',
      ttl: 20,
      priority: 'high',
    });
  }

  const chunks = expo.chunkPushNotifications(messages);

  (async () => {
    // Send the chunks to the Expo push notification service.
    for (const chunk of chunks) {
      try {
        let receipts = await expo.sendPushNotificationsAsync(chunk);
        console.log('Push notification sent');
        console.log(receipts);
      } catch (error) {
        console.error(error);
      }
    }
  })();
};
