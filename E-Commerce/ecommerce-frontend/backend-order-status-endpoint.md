# Backend change needed for Admin order management

The Frontend Admin workspace uses:

- `GET /api/Order/GetAllOrders` to list every order with its items.
- `PATCH /api/Order/UpdateStatus?id={id}` with `{ "status": 0 | 1 | 2 }` to change status.

The pasted backend code already had `UpdateStatus`, but did not show the `GetAllOrders` endpoint. Add the following members.

## 1. `IOrder.cs`

```csharp
Task<ICollection<OrderDTO>> GetAllWithItems();
```

Make sure this file already has:

```csharp
using E_COMMERCE_MANAGEMENT.DTOs;
```

## 2. `OrderCustomRepo.cs`

```csharp
public async Task<ICollection<OrderDTO>> GetAllWithItems() =>
    await _context.Orders
        .OrderByDescending(o => o.OrderDate)
        .Select(o => new OrderDTO
        {
            Id = o.Id,
            OrderDate = o.OrderDate,
            Status = o.Status,
            TotalAmount = o.TotalAmount,
            UserId = o.UserId,
            OrderItems = o.OrderItems.Select(i => new OrderItemDTO
            {
                Id = i.Id,
                ProductId = i.ProductId,
                ProductName = i.Product.Name,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice
            }).ToList()
        }).ToListAsync();
```

The file needs `using E_COMMERCE_MANAGEMENT.DTOs;` and `using Microsoft.EntityFrameworkCore;` (both were already present in the pasted code).

## 3. `OrderController.cs`

The controller should have `[Authorize]` at class level, with roles assigned to individual actions. Add:

```csharp
[Authorize(Roles = "Admin")]
[HttpGet("GetAllOrders")]
public async Task<IActionResult> GetAllOrders()
{
    return Ok(await _unitOfWork.OrderCustomRepo.GetAllWithItems());
}
```

Keep `[Authorize(Roles = "Admin")]` on `UpdateStatus`. Ensure customer-specific actions such as `GetMyOrders` and `Create` have `[Authorize(Roles = "Customer")]`. Do not leave `[Authorize(Roles = "Customer")]` on the whole controller, because role attributes on an action are additive and the Admin endpoint would then require both roles.

## Status enum sent by the Frontend

- `0` = `Pending`
- `1` = `Completed`
- `2` = `Cancelled`

The Admin route must be protected in the backend even though the Frontend hides its controls for non-admin users.
