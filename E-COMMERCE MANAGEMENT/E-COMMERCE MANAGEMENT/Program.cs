using E_COMMERCE_MANAGEMENT.Data;
using E_COMMERCE_MANAGEMENT.Mapper;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Implementation;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAutoMapper(
    x => x.AddProfile<MappingProfile>());

builder.Services.AddDbContext<My_AppContext>(options =>
options.UseSqlServer(builder.Configuration.GetConnectionString("conn")
));




builder.Services.AddScoped<IUser, UserCustomRepo>();
builder.Services.AddScoped<IOrder, OrderCustomRepo>();
builder.Services.AddScoped<IOrderItem, OrderItemCustomRepo>();
builder.Services.AddScoped<IProduct, ProductCustomRepo>();
builder.Services.AddScoped<ICategory, CategoryCustomRepo>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();



var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"]));

builder.Services.AddAuthentication(x =>
{
    x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
    .AddJwtBearer(x =>
    {
        x.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,


            ValidIssuer = builder.Configuration["JWT:Iss"],
            ValidAudience = builder.Configuration["JWT:Aud"],
            IssuerSigningKey = key
        };
    });


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
