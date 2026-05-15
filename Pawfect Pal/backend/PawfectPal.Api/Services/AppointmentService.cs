using PawfectPal.Api.Models;
using PawfectPal.Api.Repositories;

namespace PawfectPal.Api.Services
{
    public class AppointmentService
    {
        private readonly AppointmentRepository _repo;
        private readonly PetRepository _petRepo;
        private readonly BillingRepository _billingRepository;
        private readonly PaymentRepository _paymentRepository; 
        public AppointmentService(
            AppointmentRepository repo,
            PetRepository petRepo,
            BillingRepository billingRepository,
            PaymentRepository paymentRepository
            )
        {
            _repo = repo;
            _petRepo = petRepo;
            _billingRepository = billingRepository;
            _paymentRepository = paymentRepository;
        }
        public List<dynamic> GetAll()
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
            if (appointment.PaymentMode == "Cash") {
                decimal total =
                    _repo.CalculateAppointmentTotal(
                        appointmentId
                    );

                if (total > 0)
                {
                    _billingRepository.CreateBilling(appointmentId,total);
                }
                if (appointment.AmountPaid > 0)
                {
                    var billing =_billingRepository.GetBillingByAppointmentId(appointmentId);

                    if (billing != null)
                    {
                        var payment = new Payment
                        {
                            BillingId = billing.BillingId,
                            PaymentMethod = appointment.PaymentMethod,

                            ReferenceNumber = appointment.GcashRef,

                            PaidAmount = appointment.AmountPaid
                        };

                        _paymentRepository.InsertPayment(payment);

                        decimal remaining = total - appointment.AmountPaid;

                        string status = remaining <= 0 ? "Paid" : "Partial";

                        _billingRepository.UpdateBillingBalances(billing.BillingId,appointment.AmountPaid,remaining,status);
                    }                              
                }                
            }          
        }

        public void Update(Appointment appointment)
        {
            _repo.UpdateAppointment(appointment);
        }

        public void UpdateRequestStatus(int id, string status)
        {
            var validRequestStatuses = new[]
            {
                "Pending",
                "Confirmed",
                "Denied"
            };

            if (!validRequestStatuses.Contains(status))
                throw new Exception("Invalid request status.");

            _repo.UpdateRequestStatus(id, status);
        }
        public void UpdateAppStatus(int id, string status)
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

            _repo.UpdateAppStatus(id, status);
        }

        public void Delete(int id)
        {
            _repo.DeleteAppointment(id);
        }
    }
}