using System.Text.Json.Serialization;

namespace MyScheduleApp.Models;

public sealed class GraphQlRequest
{
    [JsonPropertyName("query")]
    public string Query { get; set; } = string.Empty;
}

public sealed class GraphQlResponse<T>
{
    [JsonPropertyName("data")]
    public T? Data { get; set; }
}
