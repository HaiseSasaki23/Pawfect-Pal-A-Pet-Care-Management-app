using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class AppointmentService
    {
        private readonly AppointmentRepository _repo;
        private readonly PetRepository _petRepo;

        public AppointmentService(AppointmentRepository repo, PetRepository petRepo)
        {
            _repo = repo;
            _petRepo = petRepo;
        }

        public List<Appointment> GetAll()
        {
            return _repo.GetAllAppointments();
        }

        public Appointment? GetById(int id)
        {
            return _repo.GetAppointmentById(id);
        }

        public List<dynamic> GetByUserId(int userId)
        {
            return _repo.GetAppointmentsByUserId(userId);
        }

        public void Create(Appointment appointment)
        {
            if (appointment.UserId <= 0)
                throw new Exception("User ID is required.");

            if (appointment.PetId <= 0)
                throw new Exception("Pet ID is required.");

            if (!_petRepo.PetBelongsToUser(
                    appointment.PetId,
                    appointment.UserId))
            {
                throw new Exception("Pet does not belong to this user.");
            }                

            if (appointment.AppointmentDate < DateTime.Now)
                throw new Exception("Cannot book past date.");

            if (appointment.ServiceIds == null || !appointment.ServiceIds.Any())
                throw new Exception("Select at least one service.");

            appointment.RequestStatus = "Pending";
            appointment.AppStatus = "Pending";

            int appointmentId = _repo.InsertAppointment(appointment);

            foreach (var serviceId in appointment.ServiceIds)
            {
                _repo.InsertAppointmentService(appointmentId, serviceId);
            }
        }

        public void Update(Appointment appointment)
        {
            _repo.UpdateAppointment(appointment);
        }

        public void UpdateStatus(int id, string status)
        {
            var validAppStatuses = new[]
            {
                "Pending",
                "Checked-In",
                "In-Progress",
                "Completed",
                "No-Show"
            };

            if (!validAppStatuses.Contains(status))
                throw new Exception("Invalid appointment status.");

            _repo.UpdateStatus(id, status);
        }

        public void Delete(int id)
        {
            _repo.DeleteAppointment(id);
        }
    }
}