using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class NotificationService
    {
        private readonly NotificationRepository _repo;

        public NotificationService(NotificationRepository repo)
        {
            _repo = repo;
        }

        public List<Notification> GetForUser(int userId)
            => _repo.GetByUserId(userId);

        public int GetUnreadCount(int userId)
            => _repo.GetUnreadCount(userId);

        public void MarkAsRead(int notificationId, int userId)
            => _repo.MarkAsRead(notificationId, userId);

        public void MarkAllAsRead(int userId)
            => _repo.MarkAllAsRead(userId);
    }
}
