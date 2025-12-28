using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.HttpOverrides;
using MyScheduleApp.Endpoints;
using MyScheduleApp.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    })
    .AddCookie(options =>
    {
        options.Cookie.Name = "mytasks.auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Events = new CookieAuthenticationEvents
        {
            OnRedirectToLogin = context =>
            {
                if (context.Request.Path.StartsWithSegments("/api"))
                {
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    return Task.CompletedTask;
                }

                context.Response.Redirect(context.RedirectUri);
                return Task.CompletedTask;
            }
        };
    })
    .AddGoogle(options =>
    {
        options.ClientId = builder.Configuration["Google:ClientId"] ?? string.Empty;
        options.ClientSecret = builder.Configuration["Google:ClientSecret"] ?? string.Empty;
        options.CallbackPath = "/signin-google";
        options.Events.OnCreatingTicket = async context =>
        {
            var identifyer = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? context.Principal?.FindFirstValue("sub");
            var email = context.Principal?.FindFirstValue(ClaimTypes.Email)
                ?? context.Principal?.FindFirstValue("email");
            var name = context.Principal?.FindFirstValue(ClaimTypes.Name)
                ?? context.Principal?.FindFirstValue("name");

            if (string.IsNullOrWhiteSpace(identifyer))
            {
                return;
            }

            var services = context.HttpContext.RequestServices;
            var hygraphService = services.GetRequiredService<HygraphService>();
            await hygraphService.EnsureUserAsync(identifyer, email, name);

            if (context.Identity is ClaimsIdentity identity)
            {
                identity.AddClaim(new Claim("identifyer", identifyer));
                if (!string.IsNullOrWhiteSpace(email))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Email, email));
                }

                if (!string.IsNullOrWhiteSpace(name))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Name, name));
                }
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddHttpClient();
builder.Services.AddScoped<HygraphService>();
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedProto | ForwardedHeaders.XForwardedFor;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

var hygraphUrl = builder.Configuration["Hygraph:Url"] ?? string.Empty;
var hygraphToken = builder.Configuration["Hygraph:Token"] ?? string.Empty;
var googleClientId = builder.Configuration["Google:ClientId"] ?? string.Empty;
var googleClientSecret = builder.Configuration["Google:ClientSecret"] ?? string.Empty;

if (string.IsNullOrWhiteSpace(hygraphUrl))
{
    throw new InvalidOperationException("Hygraph:Url is required.");
}

if (string.IsNullOrWhiteSpace(hygraphToken))
{
    throw new InvalidOperationException("Hygraph:Token is required.");
}

if (string.IsNullOrWhiteSpace(googleClientId) || string.IsNullOrWhiteSpace(googleClientSecret))
{
    throw new InvalidOperationException("Google:ClientId and Google:ClientSecret are required.");
}

app.MapAuthEndpoints();
app.MapTaskEndpoints();

app.Run();
