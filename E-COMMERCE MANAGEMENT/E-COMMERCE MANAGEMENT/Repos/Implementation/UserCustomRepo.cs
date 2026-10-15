using E_COMMERCE_MANAGEMENT.Data;
using E_COMMERCE_MANAGEMENT.Models;
using E_COMMERCE_MANAGEMENT.Repos.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace E_COMMERCE_MANAGEMENT.Repos.Implementation
{
    public class UserCustomRepo : GenericRepo<User>, IUser
    {
        private readonly My_AppContext _context;
        public UserCustomRepo(My_AppContext c) : base(c)
        {
            _context = c;
        }

        public async Task<User?> GetByEmail(string email)
        {
            return await _context.Users.
                FirstOrDefaultAsync(x => x.Email == email);
        }
    }
}
