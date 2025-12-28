using System.Text.Json.Serialization;

namespace MyScheduleApp.Models;

public sealed class TaskIdRecord
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }
}

public sealed class UserRecord
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("identifyer")]
    public string? Identifyer { get; set; }
}

public sealed class TaskItem
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("historic")]
    public List<HistoricItem>? Historic { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; }
}

public sealed class HistoricItem
{
    [JsonPropertyName("interval")]
    public string? Interval { get; set; }

    [JsonPropertyName("description")]
    public string? Description { get; set; }
}
