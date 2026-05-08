using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class AppointmentService
    {
        private readonly AppointmentRepository _repo;

        public AppointmentService(AppointmentRepository repo)
        {
            _repo = repo;
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
            // if (appointment.AppointmentDate < DateTime.Now)
            // throw new Exception("Cannot book past date.");

            // if (appointment.ServiceIds == null || !appointment.ServiceIds.Any())
            //     throw new Exception("Select at least one service.");

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
            var valid = new[]
            {
                "Pending", "Confirmed", "Denied",
                "Checked-In", "In-Progress", "Completed"
            };

            if (!valid.Contains(status))
                throw new Exception("Invalid status.");

            _repo.UpdateStatus(id, status);
        }

        public void Delete(int id)
        {
            _repo.DeleteAppointment(id);
        }
    }
}