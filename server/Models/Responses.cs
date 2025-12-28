using System.Text.Json.Serialization;

namespace MyScheduleApp.Models;

public sealed class LoginData
{
    [JsonPropertyName("myUsers")]
    public List<UserRecord>? MyUsers { get; set; }
}

public sealed class CreateUserData
{
    [JsonPropertyName("createMyUser")]
    public TaskIdRecord? CreateMyUser { get; set; }
}

public sealed class PublishUserData
{
    [JsonPropertyName("publishMyUser")]
    public TaskIdRecord? PublishMyUser { get; set; }
}

public sealed class TasksData
{
    [JsonPropertyName("tasks")]
    public List<TaskItem>? Tasks { get; set; }
}

public sealed class CreateTaskData
{
    [JsonPropertyName("createTask")]
    public TaskIdRecord? CreateTask { get; set; }
}

public sealed class UpdateTaskData
{
    [JsonPropertyName("updateTask")]
    public TaskIdRecord? UpdateTask { get; set; }
}

public sealed class PublishTaskData
{
    [JsonPropertyName("publishTask")]
    public TaskIdRecord? PublishTask { get; set; }
}

public sealed class DeleteTaskData
{
    [JsonPropertyName("deleteTask")]
    public TaskIdRecord? DeleteTask { get; set; }
}
