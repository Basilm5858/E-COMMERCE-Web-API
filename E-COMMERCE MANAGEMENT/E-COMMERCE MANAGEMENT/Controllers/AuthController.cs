using E_COMMERCE_MANAGEMENT.DTOs;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Win32;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace E_COMMERCE_MANAGEMENT.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IUnitOfWork _unitofwork;
        private readonly IConfiguration _configuration;
        public AuthController(IUnitOfWork unitofwork, IConfiguration configuration)   
        {
            _unitofwork = unitofwork;
            _configuration = configuration;
        }
        [HttpPost("Register")]
        public async Task<IActionResult> Register(RegisterDTO dto)
        {
            var exiemail = _unitofwork.UserCustomRepo.GetByEmail(dto.Email);

            if(exiemail != null)
            {
                return BadRequest("The email is using");
            }
            if (dto.Role != "Customer" || dto.Role != "Admin")
            {
                return BadRequest("the role must be Customer Or Admin");
            }
            var res = new User
            {
                Email = dto.Email,
                FullName = dto.FullName,
                Role = dto.Role,
                Password = dto.Password
            };
            
            await _unitofwork.UserCustomRepo.AddAsync(res);
            await _unitofwork.SaveChangesAsync();

            return Ok(res);
        }
        [HttpPost("Login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var exi = await _unitofwork.UserCustomRepo.GetByEmail(dto.Email);
            if(exi == null)
            {
                return BadRequest("invalid email or password");
            }
            if (exi.Password != dto.Password)
            {
                return BadRequest("invalid email or password");
            }
            var token = GenreateToken(exi);
            return Ok(token);
        }

        private string GenreateToken(User user)
        {
            // payload
            var claims = new List<Claim>()
            {
                new Claim(ClaimTypes.NameIdentifier,user.Id.ToString()),
                new Claim(ClaimTypes.Name,user.FullName),
                new Claim(ClaimTypes.Role,user.Role),
                new Claim(ClaimTypes.Email,user.Email)
            };

            // key
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:Iss"],
                audience: _configuration["JWT:Aud"],
                signingCredentials: creds,
                claims: claims,
                expires: DateTime.Now.AddHours(1)
                );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }



    }
}
