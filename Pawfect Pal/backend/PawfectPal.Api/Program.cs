using PawfectPal.Api.Data;
using PawfectPal.Api.Repositories;
using PawfectPal.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Register custom services
builder.Services.AddSingleton<DatabaseHelper>();

builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<PetRepository>();
builder.Services.AddScoped<DashboardRepository>();
builder.Services.AddScoped<AppointmentRepository>();


builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<PetService>();
builder.Services.AddScoped<DashboardService>();
builder.Services.AddScoped<AppointmentService>();
builder.Services.AddScoped<EmailService>();

var app = builder.Build();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();