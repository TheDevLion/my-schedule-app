using System.Security.Claims;
using MyScheduleApp.Models;
using MyScheduleApp.Services;

namespace MyScheduleApp.Endpoints;

public static class TaskEndpoints
{
    public static void MapTaskEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tasks", async (string? date, ClaimsPrincipal user, HygraphService hygraphService) =>
            {
                var identifyer = user.FindFirstValue("identifyer");
                if (string.IsNullOrWhiteSpace(identifyer))
                {
                    return Results.Unauthorized();
                }

                var tasks = await hygraphService.GetTasksAsync(identifyer, date);
                return Results.Ok(tasks);
            })
            .RequireAuthorization();

        app.MapPost("/api/tasks", async (CreateTaskRequest request, ClaimsPrincipal user, HygraphService hygraphService) =>
            {
                var identifyer = user.FindFirstValue("identifyer");
                if (string.IsNullOrWhiteSpace(identifyer) || string.IsNullOrWhiteSpace(request.Title))
                {
                    return Results.BadRequest();
                }

                var id = await hygraphService.CreateTaskAsync(identifyer, request.Title, request.Date);
                if (string.IsNullOrWhiteSpace(id))
                {
                    return Results.Problem("Failed to create task.");
                }

                return Results.Ok(new { id });
            })
            .RequireAuthorization();

        app.MapPost("/api/tasks/{id}/pause", async (string id, PauseTaskRequest request, ClaimsPrincipal user, HygraphService hygraphService) =>
            {
                var identifyer = user.FindFirstValue("identifyer");
                if (string.IsNullOrWhiteSpace(identifyer) || string.IsNullOrWhiteSpace(id))
                {
                    return Results.BadRequest();
                }

                var updated = await hygraphService.UpdateTaskHistoricAsync(id, request.Historic);
                if (!updated)
                {
                    return Results.Problem("Failed to update task.");
                }

                return Results.Ok();
            })
            .RequireAuthorization();

        app.MapDelete("/api/tasks/{id}", async (string id, ClaimsPrincipal user, HygraphService hygraphService) =>
            {
                var identifyer = user.FindFirstValue("identifyer");
                if (string.IsNullOrWhiteSpace(identifyer) || string.IsNullOrWhiteSpace(id))
                {
                    return Results.BadRequest();
                }

                var deleted = await hygraphService.DeleteTaskAsync(id);
                if (!deleted)
                {
                    return Results.Problem("Failed to delete task.");
                }

                return Results.Ok();
            })
            .RequireAuthorization();
    }
}
