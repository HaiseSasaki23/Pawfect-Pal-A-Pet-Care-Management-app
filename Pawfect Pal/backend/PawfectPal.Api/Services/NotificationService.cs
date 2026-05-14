using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public NotificationController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    private MySqlConnection GetConnection()
    {
        return new MySqlConnection(
            _configuration.GetConnectionString("DefaultConnection")
        );
    }

    [HttpGet("user/{userId}")]
    public async Task<IActionResult> GetUserNotifications(int userId)
    {
        List<Notification> notifications = new List<Notification>();

        using (var conn = GetConnection())
        {
            await conn.OpenAsync();

            string query = @"SELECT * FROM notifications
                             WHERE UserID = @UserID
                             ORDER BY CreatedAt DESC";

            using (var cmd = new MySqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@UserID", userId);

                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        notifications.Add(new Notification
                        {
                            NotificationID = Convert.ToInt32(reader["NotificationID"]),
                            UserID = Convert.ToInt32(reader["UserID"]),
                            Title = reader["Title"].ToString(),
                            Message = reader["Message"].ToString(),
                            Type = reader["Type"].ToString(),
                            ReferenceID = reader["ReferenceID"] == DBNull.Value
                                ? null
                                : Convert.ToInt32(reader["ReferenceID"]),
                            IsRead = Convert.ToBoolean(reader["IsRead"]),
                            CreatedAt = Convert.ToDateTime(reader["CreatedAt"])
                        });
                    }
                }
            }
        }

        return Ok(notifications);
    }

    [HttpPut("read/{id}")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        using (var conn = GetConnection())
        {
            await conn.OpenAsync();

            string query = @"UPDATE notifications
                             SET IsRead = TRUE
                             WHERE NotificationID = @ID";

            using (var cmd = new MySqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@ID", id);

                await cmd.ExecuteNonQueryAsync();
            }
        }

        return Ok(new { message = "Notification marked as read." });
    }

    [HttpPost]
    public async Task<IActionResult> CreateNotification([FromBody] Notification notification)
    {
        using (var conn = GetConnection())
        {
            await conn.OpenAsync();

            string query = @"INSERT INTO notifications
                            (UserID, Title, Message, Type, ReferenceID)
                            VALUES
                            (@UserID, @Title, @Message, @Type, @ReferenceID)";

            using (var cmd = new MySqlCommand(query, conn))
            {
                cmd.Parameters.AddWithValue("@UserID", notification.UserID);
                cmd.Parameters.AddWithValue("@Title", notification.Title);
                cmd.Parameters.AddWithValue("@Message", notification.Message);
                cmd.Parameters.AddWithValue("@Type", notification.Type);
                cmd.Parameters.AddWithValue("@ReferenceID",
                    notification.ReferenceID ?? (object)DBNull.Value);

                await cmd.ExecuteNonQueryAsync();
            }
        }

        return Ok(new { message = "Notification created successfully." });
    }
}