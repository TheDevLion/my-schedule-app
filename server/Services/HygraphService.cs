using System.Net.Http.Headers;
using System.Net.Http.Json;
using MyScheduleApp.Models;

namespace MyScheduleApp.Services;

public sealed class HygraphService
{
    private readonly IHttpClientFactory _factory;
    private readonly string _url;
    private readonly string _token;

    public HygraphService(IHttpClientFactory factory, IConfiguration configuration)
    {
        _factory = factory;
        _url = configuration["Hygraph:Url"] ?? string.Empty;
        _token = configuration["Hygraph:Token"] ?? string.Empty;
    }

    public async Task EnsureUserAsync(string identifyer, string? email, string? name)
    {
        var query = $@"
            query MyQuery {{
                myUsers(where: {{identifyer: ""{EscapeGraphQlString(identifyer)}""}})
                {{
                    id
                    identifyer
                }}
            }}
            ";

        var response = await SendGraphQl<LoginData>(query);
        var existing = response?.Data?.MyUsers?.FirstOrDefault();
        if (existing != null)
        {
            return;
        }

        var createQuery = $@"
            mutation MyMutation {{
                createMyUser(
                    data: {{
                        identifyer: ""{EscapeGraphQlString(identifyer)}"",
                        email: ""{EscapeGraphQlString(email ?? string.Empty)}"",
                        name: ""{EscapeGraphQlString(name ?? string.Empty)}""
                    }}
                ) {{
                    id
                }}
            }}
            ";

        var created = await SendGraphQl<CreateUserData>(createQuery);
        var id = created?.Data?.CreateMyUser?.Id;
        if (string.IsNullOrWhiteSpace(id))
        {
            return;
        }

        var publishQuery = $@"
            mutation MyMutation {{
                publishMyUser(where: {{id: ""{EscapeGraphQlString(id)}""}})
                {{
                    id
                }}
            }}
            ";

        await SendGraphQl<PublishUserData>(publishQuery);
    }

    public async Task<List<TaskItem>> GetTasksAsync(string identifyer, string? date)
    {
        var targetDate = string.IsNullOrWhiteSpace(date) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : date;
        var query = $@"
            query MyQuery {{
                tasks(where: {{myUser: {{identifyer: ""{EscapeGraphQlString(identifyer)}""}}, date: ""{EscapeGraphQlString(targetDate)}""}}) {{
                    id
                    title
                    historic
                    date
                }}
            }}
            ";

        var response = await SendGraphQl<TasksData>(query);
        return response?.Data?.Tasks ?? new List<TaskItem>();
    }

    public async Task<string?> CreateTaskAsync(string identifyer, string title, string? date)
    {
        var targetDate = string.IsNullOrWhiteSpace(date) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : date;
        var query = $@"
            mutation MyMutation {{
                createTask(
                    data: {{date: ""{EscapeGraphQlString(targetDate)}"", title: ""{EscapeGraphQlString(title)}"", myUser: {{connect: {{identifyer: ""{EscapeGraphQlString(identifyer)}""}}}}}}
                ) {{
                    id
                }}
            }}
            ";

        var response = await SendGraphQl<CreateTaskData>(query);
        var id = response?.Data?.CreateTask?.Id;
        if (string.IsNullOrWhiteSpace(id))
        {
            return null;
        }

        var publishQuery = $@"
            mutation MyMutation {{
                publishTask(where: {{id: ""{EscapeGraphQlString(id)}""}})
                {{
                    id
                }}
            }}
            ";

        await SendGraphQl<PublishTaskData>(publishQuery);
        return id;
    }

    public async Task<bool> UpdateTaskHistoricAsync(string id, List<HistoricItem>? historic)
    {
        var historicInput = BuildHistoricInput(historic);
        var query = $@"
            mutation MyMutation {{
                updateTask(data: {{historic: {historicInput}}}, where: {{id: ""{EscapeGraphQlString(id)}""}})
                {{
                    id
                }}
            }}
            ";

        var response = await SendGraphQl<UpdateTaskData>(query);
        var updatedId = response?.Data?.UpdateTask?.Id;
        if (string.IsNullOrWhiteSpace(updatedId))
        {
            return false;
        }

        var publishQuery = $@"
            mutation MyMutation {{
                publishTask(where: {{id: ""{EscapeGraphQlString(updatedId)}""}})
                {{
                    id
                }}
            }}
            ";

        await SendGraphQl<PublishTaskData>(publishQuery);
        return true;
    }

    public async Task<bool> DeleteTaskAsync(string id)
    {
        var query = $@"
            mutation MyMutation {{
                deleteTask(where: {{id: ""{EscapeGraphQlString(id)}""}})
                {{
                    id
                }}
            }}
            ";

        var response = await SendGraphQl<DeleteTaskData>(query);
        return !string.IsNullOrWhiteSpace(response?.Data?.DeleteTask?.Id);
    }

    private async Task<GraphQlResponse<T>?> SendGraphQl<T>(string query)
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _token);
        var response = await client.PostAsJsonAsync(_url, new GraphQlRequest { Query = query });
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<GraphQlResponse<T>>();
    }

    private static string EscapeGraphQlString(string value)
    {
        return value
            .Replace("\\", "\\\\")
            .Replace("\"", "\\\"")
            .Replace("\r", "\\r")
            .Replace("\n", "\\n");
    }

    private static string BuildHistoricInput(List<HistoricItem>? items)
    {
        if (items == null || items.Count == 0)
        {
            return "[]";
        }

        var parts = new List<string>();
        foreach (var item in items)
        {
            var interval = EscapeGraphQlString(item.Interval ?? string.Empty);
            var description = EscapeGraphQlString(item.Description ?? string.Empty);
            parts.Add($"{{interval: \"{interval}\", description: \"{description}\"}}");
        }

        return $"[{string.Join(",", parts)}]";
    }
}
