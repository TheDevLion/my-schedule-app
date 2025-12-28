using System.Text.Json.Serialization;

namespace MyScheduleApp.Models;

public sealed class CreateTaskRequest
{
    [JsonPropertyName("title")]
    public string? Title { get; set; }

    [JsonPropertyName("date")]
    public string? Date { get; set; }
}

public sealed class PauseTaskRequest
{
    [JsonPropertyName("historic")]
    public List<HistoricItem>? Historic { get; set; }
}
