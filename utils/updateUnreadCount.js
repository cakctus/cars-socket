export default function updateUnreadCount(fromUser, data) {
  for (const item of data) {
    if (item.fromUser === fromUser) {
      // Update the unreadCount to 0
      item.unreadCount = 0
    }
  }
}
