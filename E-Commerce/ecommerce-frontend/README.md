# نُقطة — E-Commerce Management Frontend

واجهة متجر عربية RTL مبنية بـ **React + Vite + TypeScript + Bootstrap 5 + Axios** ومجهزة للتكامل مع الـ ASP.NET Core Web API الموجود في مشروعك.

## الصفحات والوظائف الموجودة

### تجربة العميل
- عرض المنتجات من `GET /api/Product/GetAllCategories` باستخدام معلمات paging/sorting الموجودة في الـ API.
- البحث من السيرفر عبر `GET /api/Product/Search?name=` بدل البحث المحلي فقط.
- الفلترة حسب التصنيف، مع جلب وصف التصنيف المحدد عبر `GET /api/Category/GetById?id=`.
- نافذة تفاصيل المنتج تحدث بياناته عبر `GET /api/Product/GetById?id=`.
- أداة ترشيح تستخدم `GET /api/Product/GetSecondMostExpensive?categoryid=` وتعرض أول نتيجة من القائمة المرتبة بعد استبعاد التصنيف.
- إنشاء الحساب وتسجيل الدخول باستخدام `POST /api/Auth/Register` و`POST /api/Auth/Login` وJWT.
- شاشة «حسابي» لجلب البيانات من `GET /api/Auth/UserProfile` وتعديل الاسم والإيميل عبر `PUT /api/Auth/UpdateProfile`.
- تغيير كلمة المرور عبر `PATCH /api/Auth/ChangePassword`، مع التحقق من تطابق التأكيد وحد أدنى 8 أحرف لكلمة المرور الجديدة.
- السلة محفوظة في `localStorage`. قبل تأكيد الطلب يملأ العميل رقم الهاتف وعنوان التوصيل، ثم ترسل الواجهة `phoneNumber` و`shippingAddress` و`orderItems` إلى `POST /api/Order/Create`.
- صفحة «طلباتي» تعتمد على `GET /api/Order/GetMyOrders`، وتعرض رقم الهاتف وعنوان التوصيل إذا كانا موجودين في `OrderDTO`، وتوفر تفاصيل الطلب مع `GetById` و`GetByIdWithTotalPrice`.

### أدوات Admin
- إضافة منتج عبر `POST /api/Product/Create`.
- تعديل بيانات المنتج عبر `PUT /api/Product/Update?id=`.
- تحديث المخزون عبر `PATCH /api/Product/UpdateStock?id=`.
- إضافة تصنيف عبر `POST /api/Category/Create`.
- مشاهدة جميع الطلبات عبر `GET /api/Order/GetAllOrders` وتحديث حالتها عبر `PATCH /api/Order/UpdateStatus?id=`.
- تقرير إيرادات الطلبات المكتملة عبر `GET /api/Order/CalculateTotalRevenue`.

## بيانات إنشاء الطلب

الـ Checkout يرسل البيانات بالشكل التالي، وتُحسب الأسعار النهائية في الـ Backend:

```json
{
  "phoneNumber": "01012345678",
  "shippingAddress": "المحافظة، المدينة، الشارع، رقم العقار والدور",
  "orderItems": [
    { "productId": 1001, "quantity": 2 }
  ]
}
```

تأكد أن `CreateOrderDTO` يحتوي على `PhoneNumber` و`ShippingAddress`، وأن `OrderDTO` المستخدم في `GetMyOrders` و`GetById` يعرض القيم المحفوظة في الطلب.

## التشغيل

1. فك ضغط الملف، وافتح مجلد `ecommerce-frontend` في VS Code أو Cursor.
2. انسخ `.env.example` إلى ملف باسم `.env`.
3. افتح `Properties/launchSettings.json` في مشروع الـ API، وخذ عنوان HTTPS الفعلي. عدّل `VITE_API_BASE_URL` في `.env` ليكون عنوان الـ API مع `/api` في النهاية، مثل:

   ```env
   VITE_API_BASE_URL=https://localhost:7064/api
   ```

   **المثال للتوضيح فقط**؛ استخدم البورت الفعلي عندك. لا تضف `/api` مرتين.

4. شغّل مشروع ASP.NET Core API، وبعدها من Terminal داخل مجلد الواجهة نفّذ:

   ```bash
   npm install
   npm run dev
   ```

5. افتح `http://localhost:5173`. هذا البورت متوافق مع عنوان CORS الموجود في `Program.cs` عندك (`http://localhost:5173`).

لإنشاء نسخة إنتاجية:

```bash
npm run build
npm run preview
```

الناتج النهائي للبناء هيكون في مجلد `dist`.

## نقاط تكامل لازم تبقى واخد بالك منها

- الـ API الحالي بيرجع JWT كنص من `POST /api/Auth/Login`؛ الواجهة بتتعامل مع النص، وكمان مع كائن فيه `token` لو غيّرت شكل الاستجابة لاحقًا.
- التسجيل يرسل `fullName` و`email` و`password` فقط؛ الـ Backend الحالي يعيّن `Role = "Customer"` داخل `Register`، ولا يحتاج الطلب إلى حقل `role`.
- التعديل على البروفايل وتغيير كلمة المرور يستخدمان التوكن المحفوظ تلقائيًا في ترويسة `Authorization: Bearer`.
- `UpdateProfile` و`ChangePassword` يرجعان `204 No Content`؛ الواجهة لا تحاول قراءة بيانات من الاستجابة.
- صفحة «طلباتي» مخصصة لحساب Customer لأن `GetMyOrders` بيقرأ `NameIdentifier` من توكن المستخدم.
- مسار قائمة المنتجات في الباك إند اسمه `GET /api/Product/GetAllCategories` رغم إنه بيرجع منتجات؛ الواجهة بتستخدم المسار كما هو عندك.
- لو `ProductController` ما زال عليه `[Authorize]` على مستوى الـ Controller بالكامل، فكتالوج المنتجات لن يُحمّل قبل تسجيل الدخول لأن الواجهة الحالية تسمح بالتصفح من غير حساب؛ لو المتجر لازم يكون عامًا، اسمح بالوصول المجهول إلى GET الخاص بالبحث والكتالوج والتفاصيل في الـ Backend.
- راجع `backend-api-audit.md` قبل استخدام تعديل المنتج: مسار `PUT /api/Product/Update?id=...` يحتاج تصحيح اتجاه AutoMapper (`_mapper.Map(dto, product)`).
- `OrderController` عليه `[Authorize(Roles = "Customer")]` وعلى `UpdateStatus` كمان `[Authorize(Roles = "Admin")]`. وجود الصلاحيتين بالشكل ده قد يجعل تحديث حالة الطلب يتطلب الدورين معًا؛ الواجهة تعرض لوحة الإدارة لحساب Admin، لكن طلب التحديث قد يُرفض إلى أن يتصلح الـ Authorization في الباك إند.
- لو المتصفح رفض الاتصال بشهادة HTTPS المحلية، افتح عنوان الـ API نفسه في المتصفح ووافق/ثق في شهادة التطوير المحلية، أو استخدم عنوان HTTP المحلي إن كان متاحًا وعدّل CORS بما يتناسب معه.

## ملاحظات أمان مهمة

- لا تضع مفاتيح JWT أو connection strings أو كلمات مرور حقيقية في ملفات الواجهة.
- الكود المرسل من الباك إند يقارن كلمة المرور كنص عادي؛ قبل النشر الحقيقي لازم تخزين كلمات المرور باستخدام hashing مناسب، والاستمرار في إرجاع `UserProfile` بدل كائن `User` بما فيه `Password`.
- الـ `AuthController` الحالي يعيّن `Role = "Customer"` داخل التسجيل، و`RegisterDTO` لا يحتوي على حقل `Role`. حافظ على هذا التحقق داخل السيرفر، ولا تسمح بتعيين Admin من التسجيل العام.
- لا تعتمد على إجمالي السلة في المتصفح؛ الواجهة ترسل معرفات المنتجات والكميات فقط، والسيرفر عندك يعيد حساب المبلغ اعتمادًا على السعر المخزن لديه.


## Admin Order Status Management

The Admin workspace now includes an **إدارة الطلبات** screen. It calls `GET /api/Order/GetAllOrders` to load all orders and `PATCH /api/Order/UpdateStatus?id={id}` with `{ "status": 0 | 1 | 2 }` to save a status (`0 = Pending`, `1 = Completed`, `2 = Cancelled`). The supplied backend code has the PATCH route but did not include the `GetAllOrders` GET route, so add the Admin-only endpoint below before using this screen.

In `IOrder.cs`, add:

```csharp
Task<ICollection<OrderDTO>> GetAllWithItems();
```

In `OrderCustomRepo.cs`, add this method (also add `using E_COMMERCE_MANAGEMENT.Models;` only if your IDE asks for it):

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

In `OrderController.cs`, add an Admin-only action:

```csharp
[Authorize(Roles = "Admin")]
[HttpGet("GetAllOrders")]
public async Task<IActionResult> GetAllOrders()
{
    return Ok(await _unitOfWork.OrderCustomRepo.GetAllWithItems());
}
```

Make sure `OrderController` has `[Authorize]` at class level, not `[Authorize(Roles = "Customer")]`, and put explicit role attributes on every action as appropriate. In particular, customer-specific actions must have `[Authorize(Roles = "Customer")]`, and `UpdateStatus` / `GetAllOrders` must have `[Authorize(Roles = "Admin")]`.


## تغطية الـ API وملاحظات مطلوبة في الـ Backend

| Endpoint | مكان استخدامه في الواجهة | ملاحظات |
|---|---|---|
| `POST /Auth/Register` | إنشاء حساب Customer | الطلب يحتوي على `fullName` و`email` و`password`، والـ Backend يعيّن الدور Customer. |
| `GET /Auth/UserProfile` | شاشة حسابي | يتطلب JWT ويعيد `id` و`fullName` و`email` و`role`. |
| `PUT /Auth/UpdateProfile` | تعديل الاسم والإيميل | يتطلب JWT؛ يتعامل مع تعارض الإيميل كـ 409 Conflict. |
| `PATCH /Auth/ChangePassword` | تغيير كلمة المرور | يتطلب JWT، والطلب يحتوي `oldPassword` و`newPassword`؛ الاستجابة 204. |
| `POST /Auth/Login` | تسجيل الدخول | الواجهة تقبل JWT كنص أو `{ token }`. |
| `GET /Category/GetAllCategories` | قائمة التصنيفات | مستخدم في المتجر وإدارة المنتج. |
| `GET /Category/GetById?id=` | وصف التصنيف | يفتح من اختيار التصنيف. |
| `POST /Category/Create` | إضافة تصنيف | Admin فقط. |
| `GET /Product/GetAllCategories` | كتالوج المنتجات | اسم المسار كما هو في الـ Backend رغم أنه يعرض منتجات. |
| `GET /Product/GetById?id=` | تفاصيل المنتج | يُستخدم عند فتح تفاصيل كل منتج. |
| `POST /Product/Create` | إضافة منتج | Admin فقط. |
| `PUT /Product/Update?id=` | تعديل بيانات منتج | أصلح اتجاه AutoMapper كما هو موضح أدناه. |
| `PATCH /Product/UpdateStock?id=` | تعديل المخزون | Admin فقط. |
| `GET /Product/Search?name=` | البحث | تستخدمه الواجهة عند كتابة نص البحث. |
| `GET /Product/GetSecondMostExpensive?categoryid=` | اقتراح ثاني أعلى سعر بعد استبعاد تصنيف | الكود الحالي يعيد قائمة بعد `Skip(1)`؛ الواجهة تعرض أول عنصر منها. لو المقصود منتج واحد، الأفضل تعديل الـ API ليرجع عنصرًا واحدًا. |
| `POST /Order/Create` | تأكيد الطلب | يستقبل `phoneNumber` و`shippingAddress` و`orderItems`; السعر والمخزون يتم التحقق منهما في السيرفر. |
| `GET /Order/GetMyOrders` | صفحة طلباتي | Customer فقط وتقييد المستخدم من الـ Claims؛ يجب أن يتضمن `OrderDTO` حقلي `PhoneNumber` و`ShippingAddress` لعرض بيانات التوصيل. |
| `GET /Order/GetById?id=` | تفاصيل طلب | الكود المرسل يحاول عمل Map من `TotalAmountDTO` إلى `OrderDTO` بدون خريطة معروضة؛ راجع الملاحظة التالية. |
| `GET /Order/GetByIdWithTotalPrice?id=` | السعر النهائي في تفاصيل الطلب | الـ API المرسل يرجع `TotalAmountDTO` فقط، والواجهة تستفيد منه كملخص. يجب التحقق من ملكية الطلب في السيرفر. |
| `GET /Order/CalculateTotalRevenue` | تقرير الإيرادات | النتائج بحسب الكود الحالي هي صفوف للإيراد لكل Order مكتمل؛ تجمع الواجهة القيم لعرض الإجمالي. يجب أن يكون Admin فقط. |
| `GET /Order/GetAllOrders` | إدارة الطلبات | Endpoint إضافي أُضيف/يُفترض إضافته في الـ Backend؛ Admin فقط. |
| `PATCH /Order/UpdateStatus?id=` | تغيير حالة الطلب | Admin فقط. |

### تصحيحات Backend مطلوبة قبل الاعتماد على كل الوظائف

**1. اتجاه AutoMapper في `ProductController.Update`**

الكود المرسل عندك معكوس:

```csharp
_mapper.Map(product, dto);
```

استبدله بـ:

```csharp
_mapper.Map(dto, product);
await _unitOfWork.SaveChangesAsync();
return NoContent();
```

**2. Endpoint تفاصيل Order**

في الكود الذي أرسلته، `GetByIdWithItemDetails` يرجع `TotalAmountDTO`، ثم `GetById` يحاول تحويله إلى `OrderDTO` مع أن الـ Mapping Profile المعروض لا يحتوي على `TotalAmountDTO -> OrderDTO`. لذلك قد يرجع هذا المسار خطأ 500. الأفضل أن تجعل الـ repository method الخاصة بالتفاصيل ترجع `OrderDTO` بعناصر الطلب، أو تنشئ method منفصلة للتفاصيل، بدل عمل Map غير مدعوم.

**3. صلاحيات Order**

خلي `[Authorize]` على الـ Controller، ثم حدّد كل Action حسب دوره. `GetMyOrders` و`Create` للـ Customer، و`GetAllOrders` و`UpdateStatus` و`CalculateTotalRevenue` للـ Admin. لأي endpoint يسمح بالبحث عن Order بواسطة ID، تحقق من ملكية الطلب على السيرفر قبل إرجاعه للـ Customer؛ إخفاء بيانات الطلب في الواجهة لا يكفي.

**4. تسجيل المستخدمين وكلمات المرور**

في أحدث كود Auth المرسل، التسجيل يفرض `Role = "Customer"` داخل السيرفر ولا يستقبل `Role` من DTO. لكن كلمة المرور ما زالت مخزنة كنص صريح؛ قبل النشر الحقيقي استخدم password hashing، ولا تُرجع كائن `User` الكامل من `Register`.

**5. نتيجة `GetSecondMostExpensive`**

الـ repository الحالي يستبعد التصنيف، يرتب تنازليًا ثم ينفّذ `Skip(1)` لكنه لا ينفّذ `Take(1)`؛ لذلك يرجع كل العناصر بدءًا من العنصر الثاني. الواجهة تعرض أول عنصر فقط كاقتراح. الأفضل جعل الـ API نفسه يرجع `ProductDTO?` باستخدام `Skip(1).FirstOrDefaultAsync()` إذا كان هذا هو المطلوب فعلًا.

لخريطة endpoints كاملة والتعديلات المطلوبة في الـ Backend (بما فيها تفاصيل الطلب وصلاحيات التقارير)، راجع `backend-api-audit.md`.

## Pagination (20 products per page)

The catalog now requests products from `GET /api/Product/GetAllCategories` using:

- `pageno`: 1-based page number
- `pagesize`: fixed to `20`
- `categoryid`: optional category filter
- `sortBy`: `featured`, `priceasc`, `pricedesc`, or `stock`

For accurate page buttons and result counts, the endpoint should return a paged response object with `items`, `pageNumber`, `pageSize`, `totalCount`, `totalPages`, `hasPreviousPage`, and `hasNextPage` (camelCase JSON). The UI also keeps a fallback for the old array response, but an array cannot report the true total number of records for server-side pagination.

Search currently uses `GET /api/Product/Search?name=...`. Since that endpoint returns a list in the provided backend, the UI paginates the search matches in the browser. Product pages themselves are fetched from the server 20 at a time. The cart caches products already viewed so a product added from an earlier page remains available in the cart when the user navigates to another page.
