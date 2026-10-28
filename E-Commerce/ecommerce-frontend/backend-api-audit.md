# Backend compatibility checklist for the expanded frontend

The frontend now has UI flows for the API endpoints listed below. A few routes from the pasted backend implementation have known contract/authorization issues, so apply these backend corrections for complete integration.

## 1. Product Update has reversed AutoMapper arguments

In `ProductController.Update`, replace:

```csharp
_mapper.Map(product, dto);
```

with:

```csharp
_mapper.Map(dto, product);
await _unitOfWork.SaveChangesAsync();
return NoContent();
```

The frontend uses `PUT /api/Product/Update?id={id}` from the Admin's **تعديل المنتج** action.

## 2. Make `Order/GetById` return an `OrderDTO` with items

In the pasted code, `GetByIdWithItemDetails` returns `TotalAmountDTO`, and `GetById` tries to map that result to `OrderDTO` without a shown mapping. This can fail at runtime and the DTO does not contain order items. Add a separate repository method.

In `IOrder.cs`:

```csharp
Task<OrderDTO?> GetOrderDetails(int id);
```

In `OrderCustomRepo.cs`:

```csharp
public async Task<OrderDTO?> GetOrderDetails(int id) =>
    await _context.Orders
        .Where(o => o.Id == id)
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
        })
        .FirstOrDefaultAsync();
```

Update `OrderController.GetById` to use this method, and restrict access as follows:

```csharp
[Authorize(Roles = "Customer,Admin")]
[HttpGet("GetById")]
public async Task<IActionResult> GetById(int id)
{
    var order = await _unitOfWork.OrderCustomRepo.GetOrderDetails(id);
    if (order == null) return NotFound();

    if (User.IsInRole("Customer") &&
        (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId) || order.UserId != userId))
        return Forbid();

    return Ok(order);
}
```

Make sure `OrderController.cs` imports `System.Security.Claims`.

## 3. Protect the price-summary endpoint too

`GET /api/Order/GetByIdWithTotalPrice?id={id}` is used by the order-detail modal. It must not allow a customer to query any other customer's ID. Fetch the order record first, then only return the total summary if the caller is Admin or the order's `UserId` matches the current user's `NameIdentifier` claim. Apply `[Authorize(Roles = "Customer,Admin")]` and the same ownership check.

## 4. Use correct roles for the Order controller

Use `[Authorize]` at controller level and role attributes on every endpoint. Suggested policy:

- Customer: `Create`, `GetMyOrders`, and own-order `GetById` / `GetByIdWithTotalPrice`.
- Admin: `GetAllOrders`, `UpdateStatus`, and `CalculateTotalRevenue`.

`[Authorize(Roles = "Customer,Admin")]` on either order-details endpoint means either role can enter the action; it does not by itself protect a customer's other orders, so keep the ownership check above.

## 5. The GetSecondMostExpensive repository returns a collection

The pasted implementation filters out a category and applies descending order, then `Skip(1)`, but doesn't call `Take(1)`. Therefore it returns a list beginning with the second most expensive eligible product. The frontend currently displays the first result. If the intended API contract is one product only, replace the return query with `Skip(1).Select(...).FirstOrDefaultAsync()` and update its interface/controller response type to `ProductDTO?`.

## 6. Revenue report

The pasted `CalculateTotalRevenue` groups by `Order.Id`, so it returns a revenue row per completed order rather than a single total. The UI sums those rows to report total revenue. Keep this endpoint Admin-only. If you want the API to return one aggregate figure instead, adjust the DTO and return shape, then update the frontend to match.

## 7. Auth hardening before deployment

The latest `RegisterDTO` contains `FullName`, `Email`, and `Password` only, and the latest `Register` action assigns `Role = "Customer"` server-side. Keep that server-side role assignment. The current code still stores passwords as plain text; hash passwords using ASP.NET Core's password hasher before deployment, and avoid returning the full `User` entity from registration because it includes `Password`.

## Frontend route map

- Auth: `POST /Auth/Register`, `POST /Auth/Login`, `GET /Auth/UserProfile`, `PUT /Auth/UpdateProfile`, `PATCH /Auth/ChangePassword`
- Category: `GET /Category/GetAllCategories`, `GET /Category/GetById`, `POST /Category/Create`
- Product: `GET /Product/GetAllCategories`, `GET /Product/GetById`, `POST /Product/Create`, `PUT /Product/Update`, `PATCH /Product/UpdateStock`, `GET /Product/Search`, `GET /Product/GetSecondMostExpensive`
- Order: `POST /Order/Create`, `GET /Order/GetMyOrders`, `GET /Order/GetById`, `GET /Order/GetByIdWithTotalPrice`, `GET /Order/CalculateTotalRevenue`, `GET /Order/GetAllOrders`, `PATCH /Order/UpdateStatus`

`GetAllOrders` needs to exist in the backend and be Admin-only, as discussed earlier. All authorization and ownership checks must be enforced by the API rather than relying on hidden frontend controls.
