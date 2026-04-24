using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class DashboardService
    {
        private readonly DashboardRepository _dashboardRepository;

        public DashboardService(DashboardRepository dashboardRepository)
        {
            _dashboardRepository = dashboardRepository;
        }

        public DashboardSummary GetAdminSummary()
        {
            return new DashboardSummary
            {
                TotalPets = _dashboardRepository.GetTotalPets(),
                TotalAppointments = _dashboardRepository.GetTotalAppointments(),
                TotalReminders = _dashboardRepository.GetTotalReminders(),
                TotalHealthRecords = _dashboardRepository.GetTotalHealthRecords()
            };
        }

        public DashboardSummary GetUserSummary(int userId)
        {
            return new DashboardSummary
            {
                TotalPets = _dashboardRepository.GetTotalPetsByUserId(userId),
                TotalAppointments = _dashboardRepository.GetTotalAppointmentsByUserId(userId),
                TotalReminders = _dashboardRepository.GetTotalRemindersByUserId(userId),
                TotalHealthRecords = _dashboardRepository.GetTotalHealthRecordsByUserId(userId)
            };
        }
    }
}