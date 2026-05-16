using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class NotificationBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<NotificationBackgroundService> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(1);

        public NotificationBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<NotificationBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("NotificationBackgroundService started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var repo = scope.ServiceProvider.GetRequiredService<NotificationRepository>();

                    CheckConfirmedAppointments(repo);
                    CheckTomorrowAppointments(repo);
                    CheckTomorrowBillings(repo);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NotificationBackgroundService error.");
                }

                await Task.Delay(_interval, stoppingToken);
            }
        }

        private void CheckConfirmedAppointments(NotificationRepository repo)
        {
            foreach (var (aptId, userId, aptDate) in repo.GetRecentlyConfirmed())
            {
                if (repo.Exists(userId, "appointment_confirmed", aptId)) continue;

                repo.Create(new Notification
                {
                    UserId      = userId,
                    Title       = "Appointment Confirmed! 🎉",
                    Message     = $"Your appointment on {aptDate:MMMM dd, yyyy 'at' hh:mm tt} has been confirmed by the admin.",
                    Type        = "appointment_confirmed",
                    ReferenceId = aptId
                });

                _logger.LogInformation("Created appointment_confirmed for User {UserId}, Apt {AptId}.", userId, aptId);
            }
        }

        private void CheckTomorrowAppointments(NotificationRepository repo)
        {
            foreach (var (aptId, userId, aptDate) in repo.GetTomorrowAppointments())
            {
                if (repo.Exists(userId, "appointment_reminder", aptId)) continue;

                repo.Create(new Notification
                {
                    UserId      = userId,
                    Title       = "Appointment Tomorrow 🐾",
                    Message     = $"Reminder: You have an appointment tomorrow, {aptDate:MMMM dd, yyyy 'at' hh:mm tt}. Please be on time!",
                    Type        = "appointment_reminder",
                    ReferenceId = aptId
                });

                _logger.LogInformation("Created appointment_reminder for User {UserId}, Apt {AptId}.", userId, aptId);
            }
        }

        private void CheckTomorrowBillings(NotificationRepository repo)
        {
            foreach (var (billingId, userId, remaining, dueDate) in repo.GetTomorrowDueBillings())
            {
                if (repo.Exists(userId, "billing_reminder", billingId)) continue;

                repo.Create(new Notification
                {
                    UserId      = userId,
                    Title       = "Payment Due Tomorrow 💳",
                    Message     = $"You have an outstanding balance of ₱{remaining:N2} due on {dueDate:MMMM dd, yyyy}. Please settle before the due date.",
                    Type        = "billing_reminder",
                    ReferenceId = billingId
                });

                _logger.LogInformation("Created billing_reminder for User {UserId}, Billing {BillingId}.", userId, billingId);
            }
        }
    }
}
