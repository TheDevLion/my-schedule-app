using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;

namespace MyScheduleApp.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/me", (ClaimsPrincipal user) =>
            {
                if (user.Identity?.IsAuthenticated != true)
                {
                    return Results.Unauthorized();
                }

                return Results.Ok(new
                {
                    identifyer = user.FindFirstValue("identifyer"),
                    email = user.FindFirstValue(ClaimTypes.Email),
                    name = user.FindFirstValue(ClaimTypes.Name)
                });
            })
            .RequireAuthorization();

        app.MapGet("/api/login/google", (HttpContext httpContext) =>
        {
            var properties = new AuthenticationProperties
            {
                RedirectUri = "/tasks.html"
            };

            return Results.Challenge(properties, new[] { GoogleDefaults.AuthenticationScheme });
        });

        app.MapPost("/api/logout", async (HttpContext httpContext) =>
        {
            await httpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return Results.Ok();
        });
    }
}
