import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  AlertCircle, ArrowLeft, BadgeCheck, BarChart3, Boxes, Check, CheckCircle2, ChevronDown, ClipboardList,
  CreditCard, Eye, Heart, LogOut, Menu, Minus, Package, Pencil, Plus, RefreshCw, Search,
  ShieldCheck, ShoppingBag, ShoppingCart, SlidersHorizontal, Sparkles, Tag, Trash2, TrendingUp, Truck,
  UserRound, X, MapPin, Phone,
} from 'lucide-react';
import { api, getErrorMessage, readJwtUser } from './api';
import type { Category, Order, PagedResult, Product, UserProfile } from './types';

type View = 'shop' | 'orders' | 'profile';
type AuthMode = 'login' | 'register';
type Cart = Record<number, number>;
type RevenueRow = { id: number; totalRevenue: number };
type OrderDetailState = { order: Order; apiTotal?: number; detailNote?: string };
const PAGE_SIZE = 20;

const money = (value: number) => new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(Number(value) || 0);
const statusText = (status: number | string) => {
  const normalized = String(status).toLowerCase();
  if (normalized === '1' || normalized === 'completed') return 'مكتمل';
  if (normalized === '2' || normalized === 'cancelled') return 'ملغي';
  return 'قيد المراجعة';
};
const normalizeStatus = (status: number | string): number => {
  const normalized = String(status).toLowerCase();
  if (normalized === '1' || normalized === 'completed') return 1;
  if (normalized === '2' || normalized === 'cancelled') return 2;
  return 0;
};
const statusClass = (status: number | string) => {
  const text = statusText(status);
  return text === 'مكتمل' ? 'status-complete' : text === 'ملغي' ? 'status-cancelled' : 'status-pending';
};

function App() {
  // `products` is the current API page, except while searching, when it holds all search matches.
  const [products, setProducts] = useState<Product[]>([]);
  const [knownProducts, setKnownProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [allProductsCount, setAllProductsCount] = useState(0);
  const [categoryCounts, setCategoryCounts] = useState<Record<number, number | null>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [categoryDetail, setCategoryDetail] = useState<Category | null>(null);
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [productDetailLoading, setProductDetailLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({ name: '', description: '', price: '', stockQuantity: '', categoryId: '' });
  const [recommendationCategoryId, setRecommendationCategoryId] = useState('');
  const [recommendedProduct, setRecommendedProduct] = useState<Product | null>(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'stock'>('featured');
  const [view, setView] = useState<View>('shop');
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [cart, setCart] = useState<Cart>(() => {
    try { return JSON.parse(localStorage.getItem('ecom_cart') || '{}') as Cart; } catch { return {}; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ecom_token'));
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [adminOrdersLoading, setAdminOrdersLoading] = useState(false);
  const [adminOrdersError, setAdminOrdersError] = useState('');
  const [selectedOrderStatuses, setSelectedOrderStatuses] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [adminOrdersOpen, setAdminOrdersOpen] = useState(false);
  const [adminReportsOpen, setAdminReportsOpen] = useState(false);
  const [revenueRows, setRevenueRows] = useState<RevenueRow[]>([]);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [revenueError, setRevenueError] = useState('');
  const [activeOrderDetail, setActiveOrderDetail] = useState<OrderDetailState | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', stockQuantity: '', categoryId: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  const jwtUser = useMemo(() => readJwtUser(token), [token]);
  const isAdmin = jwtUser?.role?.toLowerCase() === 'admin';
  const isCustomer = jwtUser?.role?.toLowerCase() === 'customer';

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const isSearching = Boolean(search.trim());
      const productParams = isSearching
        ? { name: search.trim() }
        : {
            pageno: currentPage,
            pagesize: PAGE_SIZE,
            ...(selectedCategory === 'all' ? {} : { categoryid: selectedCategory }),
            sortBy: sortBy === 'price-low'
              ? 'priceasc'
              : sortBy === 'price-high'
                ? 'pricedesc'
                : sortBy === 'stock'
                  ? 'stock'
                  : 'featured',
          };

      const [productsResponse, categoriesResponse] = await Promise.all([
        api.get<Product[] | PagedResult<Product>>(
          isSearching ? '/Product/Search' : '/Product/GetAllCategories',
          { params: productParams },
        ),
        api.get<Category[]>('/Category/GetAllCategories'),
      ]);

      const responseBody = productsResponse.data;
      const responseItems: Product[] = Array.isArray(responseBody)
        ? responseBody
        : Array.isArray(responseBody?.items)
          ? responseBody.items
          : [];
      const categoryData = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      setCategories(categoryData);
      if (categoryData.length) {
        setRecommendationCategoryId((current) => current || String(categoryData[0].id));
      }

      // Cache product details already seen, so the cart can still show items from other pages.
      setKnownProducts((current) => {
        const byId = new Map<number, Product>(current.map((product) => [product.id, product]));
        responseItems.forEach((product) => byId.set(product.id, product));
        return Array.from(byId.values());
      });

      if (isSearching) {
        // The Search endpoint currently returns a list, so pagination for search matches is done here.
        const matched = responseItems.filter((product) =>
          selectedCategory === 'all' || product.categoryId === selectedCategory,
        );
        setProducts(matched);
        setTotalProducts(matched.length);
        setTotalPages(Math.max(1, Math.ceil(matched.length / PAGE_SIZE)));
      } else {
        // New API shape: { items, pageNumber, pageSize, totalCount, totalPages, ... }.
        // Keep array support as a fallback while the backend is being updated.
        const pageMeta = Array.isArray(responseBody) ? null : responseBody;
        const count = Number(pageMeta?.totalCount ?? responseItems.length);
        const pages = Number(pageMeta?.totalPages ?? Math.max(1, Math.ceil(count / PAGE_SIZE)));
        setProducts(responseItems);
        setTotalProducts(Number.isFinite(count) ? count : responseItems.length);
        setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);
        if (selectedCategory === 'all') {
          setAllProductsCount(Number.isFinite(count) ? count : responseItems.length);
        }
      }

    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [sortBy, search, currentPage, selectedCategory]);

  const loadProfile = useCallback(async () => {
    if (!token) {
      setProfile(null);
      setProfileError('سجّل الدخول الأول علشان تقدر تعرض بيانات حسابك.');
      return;
    }
    setProfileLoading(true);
    setProfileError('');
    try {
      const response = await api.get<UserProfile>('/Auth/UserProfile');
      setProfile(response.data);
      setProfileForm({ fullName: response.data.fullName || '', email: response.data.email || '' });
    } catch (e) {
      setProfile(null);
      setProfileError(getErrorMessage(e));
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fullName = profileForm.fullName.trim();
    const email = profileForm.email.trim();
    if (fullName.length < 3 || !email) {
      setProfileError('اكتب الاسم (3 أحرف على الأقل) والبريد الإلكتروني بشكل صحيح.');
      return;
    }
    setProfileSaving(true);
    setProfileError('');
    try {
      await api.put('/Auth/UpdateProfile', { fullName, email });
      setProfile((current) => current ? { ...current, fullName, email } : current);
      setProfileForm({ fullName, email });
      setNotice('تم تحديث بيانات الحساب بنجاح.');
    } catch (e) {
      setProfileError(getErrorMessage(e));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    if (passwordForm.newPassword.length < 8) {
      setPasswordError('كلمة المرور الجديدة لازم تكون 8 أحرف على الأقل.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('تأكيد كلمة المرور مش مطابق لكلمة المرور الجديدة.');
      return;
    }
    setPasswordSaving(true);
    try {
      await api.patch('/Auth/ChangePassword', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('تم تغيير كلمة المرور بنجاح. استخدم كلمة المرور الجديدة في تسجيل الدخول القادم.');
      setNotice('تم تغيير كلمة المرور بنجاح.');
    } catch (e) {
      setPasswordError(getErrorMessage(e));
    } finally {
      setPasswordSaving(false);
    }
  };

  const loadOrders = useCallback(async () => {
    if (!token || !isCustomer) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await api.get<Order[]>('/Order/GetMyOrders');
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setOrdersError(getErrorMessage(e));
    } finally {
      setOrdersLoading(false);
    }
  }, [token, isCustomer]);

  const loadAdminOrders = useCallback(async () => {
    if (!token || !isAdmin) {
      setAdminOrders([]);
      return;
    }
    setAdminOrdersLoading(true);
    setAdminOrdersError('');
    try {
      const response = await api.get<Order[]>('/Order/GetAllOrders');
      const items = Array.isArray(response.data) ? response.data : [];
      setAdminOrders(items);
      setSelectedOrderStatuses(Object.fromEntries(items.map((order) => [order.id, normalizeStatus(order.status)])));
    } catch (e) {
      setAdminOrdersError(getErrorMessage(e));
    } finally {
      setAdminOrdersLoading(false);
    }
  }, [token, isAdmin]);

  const loadRevenueReport = useCallback(async () => {
    if (!token || !isAdmin) return;
    setRevenueLoading(true);
    setRevenueError('');
    try {
      const response = await api.get<RevenueRow[]>('/Order/CalculateTotalRevenue');
      setRevenueRows(Array.isArray(response.data) ? response.data : []);
    } catch (e) {
      setRevenueError(getErrorMessage(e));
    } finally {
      setRevenueLoading(false);
    }
  }, [token, isAdmin]);

  const goToCatalogPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(totalPages, page)));
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openCategoryDetails = async (categoryId: number | 'all') => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
    if (categoryId === 'all') {
      setCategoryDetail(null);
      return;
    }
    try {
      const response = await api.get<Category>('/Category/GetById', { params: { id: categoryId } });
      setCategoryDetail(response.data);
    } catch (e) {
      setCategoryDetail(null);
      setNotice(`تعذر تحميل تفاصيل التصنيف: ${getErrorMessage(e)}`);
    }
  };

  const openProductDetails = async (product: Product) => {
    setProductDetail(product);
    setProductDetailLoading(true);
    try {
      const response = await api.get<Product>('/Product/GetById', { params: { id: product.id } });
      setProductDetail(response.data);
    } catch (e) {
      setNotice(`تعذر تحميل أحدث تفاصيل المنتج: ${getErrorMessage(e)}`);
    } finally {
      setProductDetailLoading(false);
    }
  };

  const openProductEditor = (product: Product) => {
    setEditingProduct(product);
    setEditProductForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stockQuantity: String(product.stockQuantity),
      categoryId: String(product.categoryId),
    });
  };

  const saveProductEdits = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingProduct) return;
    setBusy(true);
    try {
      await api.put(`/Product/Update?id=${editingProduct.id}`, {
        name: editProductForm.name.trim(),
        description: editProductForm.description.trim() || null,
        price: Number(editProductForm.price),
        stockQuantity: Number(editProductForm.stockQuantity),
        categoryId: Number(editProductForm.categoryId),
      });
      setEditingProduct(null);
      setNotice('تم إرسال تحديث المنتج. لو البيانات لم تتغير، راجع اتجاه AutoMapper في ProductController كما هو موضح في README.');
      await loadCatalog();
    } catch (e) {
      setNotice(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const loadSecondMostExpensive = async () => {
    if (!recommendationCategoryId) {
      setRecommendationError('اختار تصنيف الأول.');
      return;
    }
    setRecommendationLoading(true);
    setRecommendationError('');
    setRecommendedProduct(null);
    try {
      const response = await api.get<Product[] | Product>('/Product/GetSecondMostExpensive', {
        params: { categoryid: Number(recommendationCategoryId) },
      });
      const data = response.data;
      const result = Array.isArray(data) ? data[0] : data;
      if (!result) {
        setRecommendationError('مفيش منتجات كفاية بعد استبعاد التصنيف ده.');
        return;
      }
      setRecommendedProduct(result);
    } catch (e) {
      setRecommendationError(getErrorMessage(e));
    } finally {
      setRecommendationLoading(false);
    }
  };

  const openOrderDetails = async (order: Order) => {
    setActiveOrderDetail({ order });
    setOrderDetailLoading(true);
    let resolvedOrder = order;
    let apiTotal: number | undefined;
    const notes: string[] = [];
    try {
      const [detailsResult, totalResult] = await Promise.allSettled([
        api.get<Order>('/Order/GetById', { params: { id: order.id } }),
        api.get<{ id?: number; totalPrice?: number; totalAmount?: number }>('/Order/GetByIdWithTotalPrice', { params: { id: order.id } }),
      ]);
      if (detailsResult.status === 'fulfilled') {
        const body = detailsResult.value.data;
        if (body && Array.isArray(body.orderItems)) resolvedOrder = { ...order, ...body };
        else notes.push('استجابة GetById لا تحتوي على عناصر الطلب المتوقعة.');
      } else {
        notes.push('GetById لم يرجع تفاصيل كاملة؛ تم الاحتفاظ بعناصر الطلب المحملة بالفعل.');
      }
      if (totalResult.status === 'fulfilled') {
        const summary = totalResult.value.data;
        const amount = Number(summary.totalPrice ?? summary.totalAmount);
        if (Number.isFinite(amount)) apiTotal = amount;
      } else {
        notes.push('تعذر جلب ملخص السعر من السيرفر.');
      }
      setActiveOrderDetail({ order: resolvedOrder, apiTotal, detailNote: notes.length ? notes.join(' ') : undefined });
    } finally {
      setOrderDetailLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadCatalog(); }, search.trim() ? 320 : 0);
    return () => window.clearTimeout(timer);
  }, [loadCatalog, search]);
  useEffect(() => {
    if (!categories.length || Object.keys(categoryCounts).length > 0) return;
    let cancelled = false;
    const loadCategoryCounts = async () => {
      const countEntries = await Promise.all(categories.map(async (category) => {
        try {
          const response = await api.get<PagedResult<Product> | Product[]>('/Product/GetAllCategories', {
            params: { categoryid: category.id, pageno: 1, pagesize: 1 },
          });
          const body = response.data;
          const count = Array.isArray(body) ? body.length : Number(body.totalCount ?? 0);
          return [category.id, Number.isFinite(count) ? count : null] as const;
        } catch {
          return [category.id, null] as const;
        }
      }));
      if (!cancelled) setCategoryCounts(Object.fromEntries(countEntries));
    };
    void loadCategoryCounts();
    return () => { cancelled = true; };
  }, [categories, categoryCounts]);
  useEffect(() => { localStorage.setItem('ecom_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    if (view === 'orders') void loadOrders();
  }, [view, loadOrders]);
  useEffect(() => {
    if (view === 'profile' && token) void loadProfile();
  }, [view, token, loadProfile]);
  useEffect(() => {
    if (adminOrdersOpen) void loadAdminOrders();
  }, [adminOrdersOpen, loadAdminOrders]);
  useEffect(() => {
    if (adminReportsOpen) void loadRevenueReport();
  }, [adminReportsOpen, loadRevenueReport]);
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const query = search.trim().toLocaleLowerCase('ar');
      const matchesSearch = !query || product.name?.toLocaleLowerCase('ar').includes(query) || product.description?.toLocaleLowerCase('ar').includes(query);
      const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    // Price ordering is also applied on the server for regular catalog requests. This keeps
    // the current page correct and makes search results sortable without a new endpoint.
    if (sortBy === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    if (sortBy === 'stock') result = [...result].sort((a, b) => b.stockQuantity - a.stockQuantity);
    return result;
  }, [products, search, selectedCategory, sortBy]);

  const visibleProducts = useMemo(() => search.trim()
    ? filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : filteredProducts, [filteredProducts, search, currentPage]);

  const paginationPages = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  const cartItems = useMemo(() => Object.entries(cart)
    .map(([id, quantity]) => ({ product: knownProducts.find((item) => item.id === Number(id)), quantity }))
    .filter((item): item is { product: Product; quantity: number } => Boolean(item.product) && item.quantity > 0), [cart, knownProducts]);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const setCartQuantity = (product: Product, quantity: number) => {
    const validQuantity = Math.max(0, Math.min(Math.floor(quantity), Math.floor(product.stockQuantity)));
    setCart((current) => {
      const next = { ...current };
      if (validQuantity === 0) delete next[product.id];
      else next[product.id] = validQuantity;
      return next;
    });
  };

  const addToCart = (product: Product) => {
    if (product.stockQuantity < 1) return;
    const currentQuantity = cart[product.id] || 0;
    if (currentQuantity >= product.stockQuantity) {
      setNotice('وصلت للكمية المتاحة من المنتج ده.');
      return;
    }
    setCartQuantity(product, currentQuantity + 1);
    setNotice('اتضاف المنتج للسلة بنجاح.');
  };

  const login = async (email: string, password: string) => {
    setBusy(true);
    setError('');
    try {
      const response = await api.post<string | { token?: string }>('/Auth/Login', { email, password });
      let newToken = typeof response.data === 'string' ? response.data : response.data?.token;
      if (typeof newToken !== 'string') throw new Error('استجابة تسجيل الدخول غير متوقعة. راجع شكل الـ response في AuthController.');
      newToken = newToken.replace(/^"|"$/g, '');
      localStorage.setItem('ecom_token', newToken);
      setProfile(null);
      setToken(newToken);
      setAuthMode(null);
      setNotice('أهلاً بيك، تم تسجيل الدخول بنجاح.');
    } catch (e) {
      setError(getErrorMessage(e));
      throw e;
    } finally {
      setBusy(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('ecom_token');
    setToken(null);
    setProfile(null);
    setProfileForm({ fullName: '', email: '' });
    setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setOrders([]);
    setView('shop');
    setAdminPanelOpen(false);
    setAdminOrdersOpen(false);
    setAdminReportsOpen(false);
    setAdminOrders([]);
    setNotice('تم تسجيل الخروج.');
  };

  const handleCheckout = async () => {
    if (!token) {
      setCartOpen(false);
      setAuthMode('login');
      setNotice('سجّل الدخول الأول علشان تكمل الطلب.');
      return;
    }
    if (!isCustomer) {
      setCheckoutError('إتمام الطلب متاح لحساب Customer فقط.');
      return;
    }
    if (!cartItems.length) return;

    const phone = checkoutPhone.trim();
    const address = checkoutAddress.trim();
    const phoneDigits = phone.replace(/\D/g, '');
    if (!phone) {
      setCheckoutError('اكتب رقم الهاتف المطلوب للتوصيل.');
      return;
    }
    if (!/^[+]?[-\d\s().]{7,20}$/.test(phone) || phoneDigits.length < 7 || phoneDigits.length > 15) {
      setCheckoutError('اكتب رقم هاتف صحيحًا من 7 إلى 15 رقمًا، ويمكنك إضافة مفتاح الدولة.');
      return;
    }
    if (address.length < 10) {
      setCheckoutError('اكتب عنوان توصيل كاملًا (10 أحرف على الأقل).');
      return;
    }
    if (address.length > 300) {
      setCheckoutError('عنوان التوصيل لازم يكون 300 حرف أو أقل.');
      return;
    }

    setCheckoutError('');
    setBusy(true);
    try {
      await api.post('/Order/Create', {
        phoneNumber: phone,
        shippingAddress: address,
        orderItems: cartItems.map(({ product, quantity }) => ({ productId: product.id, quantity })),
      });
      setCart({});
      setCartOpen(false);
      setView('orders');
      setNotice('تم تسجيل طلبك بنجاح! تقدر تتابع حالة الطلب وبيانات التوصيل من صفحة طلباتي.');
      await loadCatalog();
      await loadOrders();
    } catch (e) {
      setCheckoutError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const submitProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/Product/Create', {
        name: productForm.name.trim(),
        description: productForm.description.trim() || null,
        price: Number(productForm.price),
        stockQuantity: Number(productForm.stockQuantity),
        categoryId: Number(productForm.categoryId),
      });
      setProductForm({ name: '', description: '', price: '', stockQuantity: '', categoryId: '' });
      setNotice('تمت إضافة المنتج.');
      await loadCatalog();
    } catch (e) { setNotice(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const submitCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/Category/Create', { name: categoryForm.name.trim(), description: categoryForm.description.trim() || null });
      setCategoryForm({ name: '', description: '' });
      setNotice('تمت إضافة التصنيف.');
      await loadCatalog();
    } catch (e) { setNotice(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const editStock = async (product: Product) => {
    const input = window.prompt(`اكتب الكمية الجديدة للمخزون: ${product.name}`, String(product.stockQuantity));
    if (input === null) return;
    const stockQuantity = Number(input);
    if (!Number.isFinite(stockQuantity) || stockQuantity < 0 || stockQuantity > 1000000) {
      setNotice('اكتب كمية صحيحة من 0 إلى 1,000,000.');
      return;
    }
    setBusy(true);
    try {
      await api.patch(`/Product/UpdateStock?id=${product.id}`, { stockQuantity });
      setNotice('تم تحديث المخزون.');
      await loadCatalog();
    } catch (e) { setNotice(getErrorMessage(e)); }
    finally { setBusy(false); }
  };

  const updateAdminOrderStatus = async (order: Order) => {
    const status = selectedOrderStatuses[order.id] ?? normalizeStatus(order.status);
    setBusy(true);
    try {
      await api.patch(`/Order/UpdateStatus?id=${order.id}`, { status });
      setNotice(`تم تحديث حالة الطلب #${order.id} إلى «${statusText(status)}».`);
      await loadAdminOrders();
    } catch (e) {
      setAdminOrdersError(getErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const openProfile = () => {
    if (!token) {
      setAuthMode('login');
      setNotice('سجّل الدخول الأول علشان تقدر تدير حسابك.');
      return;
    }
    setView('profile');
    setMobileNavOpen(false);
    setAdminPanelOpen(false);
    setAdminOrdersOpen(false);
    setAdminReportsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openOrders = () => {
    if (!token) {
      setAuthMode('login');
      setNotice('سجّل الدخول علشان تشوف طلباتك.');
      return;
    }
    if (!isCustomer) {
      setNotice('صفحة طلباتي متاحة لحساب Customer.');
      return;
    }
    setView('orders');
    setMobileNavOpen(false);
  };

  return (
    <div className="app-shell">
      <div className="announcement-bar">
        <span className="announcement-dot" /> شحن سريع على الطلبات المتاحة <span className="announcement-separator">|</span> تجربة شراء بسيطة وآمنة
      </div>
      <header className="site-header">
        <div className="header-inner page-container">
          <button className="mobile-menu icon-button" aria-label="فتح القائمة" onClick={() => setMobileNavOpen((open) => !open)}><Menu size={21} /></button>
          <button className="brand" onClick={() => { setView('shop'); setSelectedCategory('all'); setCurrentPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="الصفحة الرئيسية">
            <span className="brand-mark"><ShoppingBag size={23} strokeWidth={2.5} /></span>
            <span className="brand-copy"><strong>نُقطة</strong><small>اختياراتك اليومية</small></span>
          </button>

          <div className={`main-nav ${mobileNavOpen ? 'nav-open' : ''}`}>
            <button className={`nav-link ${view === 'shop' ? 'active' : ''}`} onClick={() => { setView('shop'); setMobileNavOpen(false); }}>المتجر</button>
            <button className={`nav-link ${view === 'orders' ? 'active' : ''}`} onClick={openOrders}>طلباتي</button>
            <button className={`nav-link ${view === 'profile' ? 'active' : ''}`} onClick={openProfile}>حسابي</button>
            <button className="nav-link" onClick={() => { setAdminPanelOpen((open) => !open); setAdminOrdersOpen(false); setAdminReportsOpen(false); setView('shop'); setMobileNavOpen(false); }} disabled={!isAdmin}>إدارة المتجر</button>
            {isAdmin && <button className={`nav-link ${adminOrdersOpen ? 'active' : ''}`} onClick={() => { setAdminOrdersOpen((open) => !open); setAdminPanelOpen(false); setAdminReportsOpen(false); setView('shop'); setMobileNavOpen(false); }}>إدارة الطلبات</button>}
            {isAdmin && <button className={`nav-link ${adminReportsOpen ? 'active' : ''}`} onClick={() => { setAdminReportsOpen((open) => !open); setAdminPanelOpen(false); setAdminOrdersOpen(false); setView('shop'); setMobileNavOpen(false); }}>التقارير</button>}
          </div>

          <div className="header-actions">
            <button className="header-icon" aria-label="فتح السلة" onClick={() => setCartOpen(true)}>
              <ShoppingCart size={21} /><span className="cart-counter">{cartCount}</span>
            </button>
            {token && jwtUser ? (
              <div className="account-area">
                <div className="account-avatar"><UserRound size={18} /></div>
                <button className="account-name account-profile-link" onClick={openProfile} aria-label="فتح بيانات الحساب"><span>{profile?.fullName || jwtUser.name || 'حسابي'}</span><small>{profile?.role === 'Admin' || isAdmin ? 'مدير المتجر' : 'عميل'}</small></button>
                <button className="icon-button tiny" aria-label="تسجيل الخروج" onClick={logout}><LogOut size={17} /></button>
              </div>
            ) : (
              <button className="sign-in-btn" onClick={() => setAuthMode('login')}><UserRound size={17} /><span>دخول / حساب جديد</span></button>
            )}
          </div>
        </div>
      </header>

      <main>
        {notice && <div className="toast-note" role="status"><CheckCircle2 size={18} /><span>{notice}</span><button aria-label="إغلاق" onClick={() => setNotice('')}><X size={16} /></button></div>}
        {error && <div className="page-container"><div className="error-banner"><AlertCircle size={19} /><div><strong>تعذر تحميل بيانات المتجر</strong><span>{error}</span><small>راجع عنوان الـ API في ملف .env، وشغّل مشروع الـ Web API. تفاصيل التشغيل موجودة في README.</small></div><button className="btn-outline-light" onClick={() => void loadCatalog()}><RefreshCw size={15} /> إعادة المحاولة</button></div></div>}

        {view === 'profile' ? (
          <section className="profile-page page-container">
            <div className="orders-header">
              <div><span className="section-kicker">ACCOUNT SETTINGS</span><h1>حسابي</h1><p>راجع بياناتك، حدّث حسابك، أو غيّر كلمة المرور.</p></div>
              <div className="profile-header-actions">
                <button className="secondary-btn" onClick={() => void loadProfile()} disabled={profileLoading}><RefreshCw size={15} /> تحديث البيانات</button>
                <button className="secondary-btn" onClick={() => { setView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ArrowLeft size={17} /> رجوع للمتجر</button>
              </div>
            </div>
            {profileError && <div className="inline-error"><AlertCircle size={18} /><span>{profileError}</span><button onClick={() => void loadProfile()}>حاول تاني</button></div>}
            {profileLoading ? <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنحمّل بيانات حسابك...</div> : profile ? (
              <div className="profile-layout">
                <aside className="profile-summary-card">
                  <div className="profile-avatar-large"><UserRound size={32} /></div>
                  <h2>{profile.fullName}</h2><p>{profile.email}</p>
                  <span className="profile-role-badge">{profile.role === 'Admin' ? 'مدير المتجر · Admin' : profile.role}</span>
                  <div className="profile-security-note"><ShieldCheck size={17} /><span>بيانات الحساب مرتبطة بالـ API، والطلبات المحمية تستخدم JWT.</span></div>
                  <div className="profile-id-row"><span>رقم الحساب</span><strong>#{profile.id}</strong></div>
                </aside>
                <div className="profile-panels">
                  <section className="profile-panel">
                    <div className="profile-panel-heading"><span className="profile-panel-icon"><Pencil size={18} /></span><div><h2>البيانات الشخصية</h2><p>التعديلات بتتحفظ على حسابك مباشرة.</p></div></div>
                    <form className="edit-product-form" onSubmit={saveProfile}>
                      <label>الاسم بالكامل<input required minLength={3} maxLength={100} autoComplete="name" value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} /></label>
                      <label>البريد الإلكتروني<input required type="email" autoComplete="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} /></label>
                      <div className="admin-note"><ShieldCheck size={17} /><span>الحفظ يستخدم PUT /Auth/UpdateProfile، والاستجابة المتوقعة 204 بدون محتوى.</span></div>
                      <button className="primary-btn full-btn" disabled={profileSaving}>{profileSaving ? 'جارٍ حفظ البيانات...' : 'حفظ التغييرات'} <Check size={16} /></button>
                    </form>
                  </section>
                  <section className="profile-panel">
                    <div className="profile-panel-heading"><span className="profile-panel-icon profile-lock-icon"><ShieldCheck size={18} /></span><div><h2>تغيير كلمة المرور</h2><p>أدخل كلمة المرور الحالية ثم اختر كلمة مرور جديدة.</p></div></div>
                    {passwordError && <div className="profile-form-message is-error"><AlertCircle size={16} /><span>{passwordError}</span></div>}
                    {passwordMessage && <div className="profile-form-message is-success"><CheckCircle2 size={16} /><span>{passwordMessage}</span></div>}
                    <form className="edit-product-form" onSubmit={changePassword}>
                      <label>كلمة المرور الحالية<input required type="password" autoComplete="current-password" value={passwordForm.oldPassword} onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} /></label>
                      <label>كلمة المرور الجديدة<input required type="password" minLength={8} autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /><small className="profile-field-hint">8 أحرف على الأقل.</small></label>
                      <label>تأكيد كلمة المرور الجديدة<input required type="password" minLength={8} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} /></label>
                      <button className="secondary-btn full-btn" disabled={passwordSaving}>{passwordSaving ? 'جارٍ تغيير كلمة المرور...' : 'تغيير كلمة المرور'} <ShieldCheck size={16} /></button>
                    </form>
                  </section>
                </div>
              </div>
            ) : !profileError ? (
              <div className="orders-empty"><div className="orders-empty-art"><UserRound size={35} /></div><h2>بيانات الحساب غير متاحة</h2><p>جرّب تحديث البيانات أو سجّل الدخول مرة أخرى.</p><button className="primary-btn" onClick={() => void loadProfile()}>إعادة المحاولة <RefreshCw size={16} /></button></div>
            ) : null}
          </section>
        ) : view === 'shop' ? (
          <>
            <section className="hero page-container">
              <div className="hero-copy">
                <div className="eyebrow"><Sparkles size={15} /> اختيارات على ذوقك</div>
                <h1>كل اللي محتاجه،<br /><span>في مكان واحد.</span></h1>
                <p>اكتشف منتجات مختارة بعناية، وقارن بسهولة، وخلي طلبك الجاي أبسط من أي وقت.</p>
                <div className="hero-actions">
                  <button className="primary-btn" onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' })}>تسوّق دلوقتي <ArrowLeft size={18} /></button>
                  <div className="hero-promise"><ShieldCheck size={18} /><span>طلب واضح وأسعار من الـ API</span></div>
                </div>
                <div className="hero-stats">
                  <div><strong>{allProductsCount.toLocaleString('ar-EG')}+</strong><span>منتجات متاحة</span></div>
                  <i />
                  <div><strong>{categories.length.toLocaleString('ar-EG')}</strong><span>تصنيفات</span></div>
                  <i />
                  <div><strong>24/7</strong><span>تصفح في أي وقت</span></div>
                </div>
              </div>
              <div className="hero-visual" aria-label="رسم توضيحي لمنتجات المتجر">
                <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                <div className="floating-label label-top"><span className="mini-icon purple"><Tag size={16} /></span><span><b>اختيارات متنوعة</b><small>في تصنيفات مختلفة</small></span></div>
                <div className="hero-product-card hero-product-main"><div className="product-illustration illustration-violet"><Package size={70} strokeWidth={1.2} /></div><div className="hero-product-caption"><span>اختيار اليوم</span><strong>منتجات تستاهل تجربها</strong></div></div>
                <div className="floating-label label-bottom"><span className="mini-icon mint"><Truck size={17} /></span><span><b>خطوات شراء سهلة</b><small>من السلة لطلباتك</small></span></div>
                <div className="hero-spark spark-a">✦</div><div className="hero-spark spark-b">✧</div>
              </div>
            </section>

            <section className="benefit-strip page-container">
              <div className="benefit-item"><span className="benefit-icon"><Truck size={20} /></span><div><strong>تجربة سهلة</strong><small>اختار واطلب في خطوات بسيطة</small></div></div>
              <div className="benefit-item"><span className="benefit-icon"><ShieldCheck size={20} /></span><div><strong>حساب آمن</strong><small>دخول باستخدام JWT</small></div></div>
              <div className="benefit-item"><span className="benefit-icon"><ClipboardList size={20} /></span><div><strong>تابع طلباتك</strong><small>تفاصيل طلباتك في مكان واحد</small></div></div>
              <div className="benefit-item"><span className="benefit-icon"><CreditCard size={20} /></span><div><strong>سعر واضح</strong><small>السعر النهائي بيتحسب على السيرفر</small></div></div>
            </section>

            {isAdmin && adminOrdersOpen && (
              <section className="admin-orders-panel page-container">
                <div className="section-heading admin-orders-heading">
                  <div><span className="section-kicker">ORDER OPERATIONS</span><h2>إدارة الطلبات</h2><p>راجع الطلبات وغيّر حالتها. تعديل الحالة متاح لحساب Admin فقط.</p></div>
                  <button className="secondary-btn" onClick={() => void loadAdminOrders()} disabled={adminOrdersLoading}><RefreshCw size={15} /> تحديث الطلبات</button>
                </div>
                {adminOrdersError && <div className="inline-error"><AlertCircle size={18} /><span>{adminOrdersError}</span><button onClick={() => void loadAdminOrders()}>حاول تاني</button></div>}
                {adminOrdersLoading ? <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنحمّل كل الطلبات...</div> : adminOrders.length === 0 && !adminOrdersError ? (
                  <div className="orders-empty admin-orders-empty"><div className="orders-empty-art"><ClipboardList size={37} /></div><h2>مفيش طلبات لحد دلوقتي</h2><p>لما العملاء يعملوا طلبات، هتظهر هنا علشان تراجعها وتحدّث حالتها.</p></div>
                ) : (
                  <div className="admin-order-list">
                    {adminOrders.map((order) => (
                      <article className="admin-order-card" key={order.id}>
                        <div className="admin-order-card-top">
                          <div className="order-id-wrap"><span className="order-icon"><Package size={21} /></span><div><strong>طلب رقم #{order.id}</strong><small>{new Date(order.orderDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })} · عميل #{order.userId}</small></div></div>
                          <span className={`order-status ${statusClass(order.status)}`}>{statusText(order.status)}</span>
                        </div>
                        {(order.phoneNumber || order.shippingAddress) && <div className="order-delivery-info admin-delivery-info">
                          {order.phoneNumber && <div><Phone size={15} /><span><small>هاتف التوصيل</small><strong dir="ltr">{order.phoneNumber}</strong></span></div>}
                          {order.shippingAddress && <div><MapPin size={15} /><span><small>عنوان التوصيل</small><strong>{order.shippingAddress}</strong></span></div>}
                        </div>}
                        <div className="admin-order-items">
                          {(order.orderItems || []).map((item) => (
                            <div className="admin-order-item" key={item.id}>
                              <span>{item.productName || `منتج #${item.productId}`}</span>
                              <small>{item.quantity} × {money(item.unitPrice)}</small>
                              <strong>{money(item.quantity * item.unitPrice)}</strong>
                            </div>
                          ))}
                        </div>
                        <div className="admin-order-bottom">
                          <div className="admin-order-total"><span>الإجمالي</span><strong>{money(order.totalAmount)}</strong></div>
                          <div className="admin-status-editor">
                            <label htmlFor={`order-status-${order.id}`}>تغيير الحالة</label>
                            <select id={`order-status-${order.id}`} value={selectedOrderStatuses[order.id] ?? normalizeStatus(order.status)} onChange={(event) => setSelectedOrderStatuses((current) => ({ ...current, [order.id]: Number(event.target.value) }))}>
                              <option value={0}>Pending — قيد المراجعة</option>
                              <option value={1}>Completed — مكتمل</option>
                              <option value={2}>Cancelled — ملغي</option>
                            </select>
                            <button className="primary-btn" disabled={busy || (selectedOrderStatuses[order.id] ?? normalizeStatus(order.status)) === normalizeStatus(order.status)} onClick={() => void updateAdminOrderStatus(order)}>{busy ? 'جارٍ الحفظ...' : 'حفظ الحالة'} <Check size={16} /></button>
                          </div>
                        </div>
                        <div className="order-card-actions"><button className="secondary-btn" onClick={() => void openOrderDetails(order)}><Eye size={15} /> تفاصيل الطلب</button></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {isAdmin && adminReportsOpen && (
              <section className="admin-reports-panel page-container">
                <div className="section-heading admin-orders-heading">
                  <div><span className="section-kicker">STORE ANALYTICS</span><h2>تقارير الإيرادات</h2><p>التقرير بيعتمد على الطلبات المكتملة اللي بيرجعها الـ API.</p></div>
                  <button className="secondary-btn" onClick={() => void loadRevenueReport()} disabled={revenueLoading}><RefreshCw size={15} /> تحديث التقرير</button>
                </div>
                {revenueError && <div className="inline-error"><AlertCircle size={18} /><span>{revenueError}</span><button onClick={() => void loadRevenueReport()}>حاول تاني</button></div>}
                {revenueLoading ? <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنحسب الإيرادات...</div> : (
                  <>
                    <div className="report-metric-grid">
                      <article className="report-metric"><span className="report-metric-icon"><TrendingUp size={20} /></span><small>إجمالي إيرادات الطلبات المكتملة</small><strong>{money(revenueRows.reduce((sum, row) => sum + (Number(row.totalRevenue) || 0), 0))}</strong><span>{revenueRows.length.toLocaleString('ar-EG')} طلب مكتمل</span></article>
                      <article className="report-metric"><span className="report-metric-icon"><BarChart3 size={20} /></span><small>متوسط قيمة الطلب المكتمل</small><strong>{money(revenueRows.length ? revenueRows.reduce((sum, row) => sum + (Number(row.totalRevenue) || 0), 0) / revenueRows.length : 0)}</strong><span>محسوب من نتائج الـ API الحالية</span></article>
                    </div>
                    {revenueRows.length ? <div className="revenue-table-wrap"><table className="revenue-table"><thead><tr><th>رقم الطلب</th><th>الإيراد المسجل</th></tr></thead><tbody>{[...revenueRows].sort((a, b) => b.id - a.id).map((row) => <tr key={row.id}><td>#{row.id}</td><td>{money(Number(row.totalRevenue) || 0)}</td></tr>)}</tbody></table></div> : <div className="orders-empty admin-orders-empty"><div className="orders-empty-art"><BarChart3 size={34} /></div><h2>لا توجد إيرادات مكتملة حتى الآن</h2><p>عند تغيير حالة طلب إلى Completed سيظهر في هذا التقرير إذا كان الـ API بيحسب الحالات المكتملة فقط.</p></div>}
                  </>
                )}
              </section>
            )}

            {isAdmin && adminPanelOpen && (
              <section className="admin-panel page-container">
                <div className="section-heading admin-heading"><div><span className="section-kicker">ADMIN WORKSPACE</span><h2>إدارة المتجر</h2><p>أضف منتجات وتصنيفات جديدة من خلال الـ API.</p></div><button className="icon-button" onClick={() => setAdminPanelOpen(false)} aria-label="إغلاق"><X size={18} /></button></div>
                <div className="admin-forms">
                  <form className="admin-form" onSubmit={submitProduct}>
                    <h3><Package size={18} /> إضافة منتج</h3>
                    <label>اسم المنتج<input required minLength={2} maxLength={100} value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></label>
                    <label>الوصف<input maxLength={500} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></label>
                    <div className="form-grid-two"><label>السعر بالجنيه<input type="number" min="0.01" step="0.01" required value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></label><label>المخزون<input type="number" min="0" step="0.01" required value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })} /></label></div>
                    <label>التصنيف<select required value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}><option value="">اختار تصنيف</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                    <button className="primary-btn full-btn" disabled={busy || !categories.length}>{busy ? 'جارٍ الحفظ...' : 'حفظ المنتج'} <Plus size={17} /></button>
                  </form>
                  <form className="admin-form" onSubmit={submitCategory}>
                    <h3><Boxes size={18} /> إضافة تصنيف</h3>
                    <label>اسم التصنيف<input required minLength={2} maxLength={100} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} /></label>
                    <label>وصف التصنيف<input maxLength={200} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></label>
                    <div className="admin-note"><ShieldCheck size={18} /><span>إنشاء التصنيفات متاح لحساب Admin طبقًا لصلاحيات الـ API.</span></div>
                    <button className="secondary-btn full-btn" disabled={busy}>{busy ? 'جارٍ الحفظ...' : 'حفظ التصنيف'} <Plus size={17} /></button>
                  </form>
                </div>
              </section>
            )}

            <section className="catalog-section page-container" id="catalog">
              <div className="section-heading">
                <div><span className="section-kicker">OUR COLLECTION</span><h2>اكتشف المنتجات</h2><p>اختار من المنتجات المتاحة حسب التصنيف والسعر.</p></div>
                <span className="results-count">{totalProducts.toLocaleString('ar-EG')} منتج</span>
              </div>

              {categoryDetail && selectedCategory !== 'all' && <div className="category-detail-banner"><div className="category-detail-icon"><Tag size={20} /></div><div><strong>{categoryDetail.name}</strong><p>{categoryDetail.description || 'التصنيف ده مفيش له وصف إضافي.'}</p></div><button onClick={() => { void openCategoryDetails('all'); }} aria-label="إلغاء اختيار التصنيف"><X size={16} /></button></div>}

              <div className="catalog-toolbar">
                <div className="search-box"><Search size={19} /><input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="بتدور على إيه؟" aria-label="البحث عن منتج" /><kbd>⌕</kbd></div>
                <div className="sort-control"><SlidersHorizontal size={17} /><label htmlFor="sort-products">ترتيب حسب</label><select id="sort-products" value={sortBy} onChange={(e) => { setSortBy(e.target.value as typeof sortBy); setCurrentPage(1); }}><option value="featured">الأقرب للأول</option><option value="price-low">السعر: من الأقل للأعلى</option><option value="price-high">السعر: من الأعلى للأقل</option><option value="stock">الأكثر في المخزون</option></select><ChevronDown size={15} /></div>
              </div>

              <div className="catalog-layout">
                <aside className="category-sidebar">
                  <div className="sidebar-title"><span>التصنيفات</span><Boxes size={17} /></div>
                  <button className={`category-filter ${selectedCategory === 'all' ? 'selected' : ''}`} onClick={() => { void openCategoryDetails('all'); }}><span className="category-symbol"><ShoppingBag size={16} /></span><span>كل المنتجات</span><small>{allProductsCount}</small></button>
                  {categories.map((category, index) => (
                    <button key={category.id} className={`category-filter ${selectedCategory === category.id ? 'selected' : ''}`} onClick={() => { void openCategoryDetails(category.id); }}><span className={`category-symbol category-color-${index % 4}`}><Tag size={16} /></span><span>{category.name}</span><small>{categoryCounts[category.id] ?? '—'}</small></button>
                  ))}
                  <div className="sidebar-promo"><span className="promo-spark"><Sparkles size={17} /></span><strong>اختيارات أذكى</strong><p>استخدم البحث والتصنيفات علشان توصل للمنتج اللي يناسبك أسرع.</p></div>
                  <div className="smart-pick-box"><div className="smart-pick-title"><TrendingUp size={16} /><strong>اختيار حسب السعر</strong></div><p>اعرف ثاني أغلى منتج بعد استبعاد تصنيف معيّن.</p><select value={recommendationCategoryId} onChange={(e) => { setRecommendationCategoryId(e.target.value); setRecommendedProduct(null); setRecommendationError(''); }} aria-label="التصنيف المستبعد"><option value="">اختار تصنيف للاستبعاد</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="secondary-btn full-btn" disabled={recommendationLoading || !categories.length} onClick={() => void loadSecondMostExpensive()}>{recommendationLoading ? 'جارٍ البحث...' : 'اعرض الترشيح'} <Search size={14} /></button>{recommendationError && <small className="smart-pick-error">{recommendationError}</small>}{recommendedProduct && <div className="smart-pick-result"><strong>{recommendedProduct.name}</strong><b>{money(recommendedProduct.price)}</b><button onClick={() => void openProductDetails(recommendedProduct)}>تفاصيل المنتج</button></div>}</div>
                </aside>

                <div className="products-area">
                  {loading ? <div className="loading-grid">{Array.from({ length: 6 }).map((_, i) => <div className="skeleton-card" key={i}><div className="skeleton-art" /><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div> : visibleProducts.length === 0 ? (
                    <div className="empty-state"><span className="empty-icon"><Search size={25} /></span><h3>ملقيناش منتجات مطابقة</h3><p>جرّب تغيّر كلمة البحث أو اختار تصنيف تاني.</p><button className="secondary-btn" onClick={() => { setSearch(''); setSelectedCategory('all'); setCurrentPage(1); }}>عرض كل المنتجات</button></div>
                  ) : (
                    <div className="product-grid">
                      {visibleProducts.map((product, index) => {
                        const category = categories.find((item) => item.id === product.categoryId);
                        const quantityInCart = cart[product.id] || 0;
                        return <article className="product-card" key={product.id}>
                          <div className={`product-art art-${index % 6}`}>
                            <span className="product-category-pill">{category?.name || 'منتج'}</span>
                            <button className="favorite-button" aria-label="إضافة للمفضلة" onClick={() => setNotice('قائمة المفضلة مش متوصلة بميزة في الـ API الحالي.')}><Heart size={18} /></button>
                            <div className="product-art-symbol"><Package size={58} strokeWidth={1.25} /></div>
                            <span className="art-decoration dec-one" /><span className="art-decoration dec-two" />
                            {product.stockQuantity <= 0 && <span className="sold-out-label">نفد المخزون</span>}
                          </div>
                          <div className="product-card-content">
                            <div className="product-subtitle">{category?.name || 'مجموعة نُقطة'} <span>•</span> رقم #{product.id}</div>
                            <h3>{product.name}</h3>
                            <p className="product-description">{product.description || 'منتج مختار من متجر نُقطة، بتفاصيل واضحة وسعر محدث.'}</p>
                            <div className="product-stock-row"><span className={`stock-dot ${product.stockQuantity > 0 ? 'in-stock' : 'out-stock'}`} />{product.stockQuantity > 0 ? `متاح ${product.stockQuantity.toLocaleString('ar-EG')} في المخزون` : 'غير متاح حاليًا'}</div>
                            <div className="product-card-bottom"><div className="product-price"><strong>{money(product.price)}</strong><small>شامل سعر المنتج</small></div>
                              <button className={`add-cart-btn ${quantityInCart > 0 ? 'is-added' : ''}`} aria-label={`إضافة ${product.name} للسلة`} onClick={() => addToCart(product)} disabled={product.stockQuantity < 1 || quantityInCart >= product.stockQuantity}>{quantityInCart > 0 ? <><Check size={16} /><span>{quantityInCart}</span></> : <Plus size={19} />}</button>
                            </div>
                            <button className="product-details-link" onClick={() => void openProductDetails(product)}><Eye size={14} /> تفاصيل المنتج</button>
                            {isAdmin && <div className="admin-product-actions"><button className="stock-edit-btn" onClick={() => openProductEditor(product)}><Pencil size={13} /> تعديل المنتج</button><button className="stock-edit-btn" onClick={() => void editStock(product)}>تعديل المخزون</button></div>}
                          </div>
                        </article>;
                      })}
                    </div>
                  )}
                  {totalProducts > 0 && <div className="catalog-footer"><span>بتعرض {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalProducts)} من أصل {totalProducts.toLocaleString('ar-EG')} منتج</span><button onClick={() => void loadCatalog()}><RefreshCw size={15} /> تحديث البيانات</button></div>}
                  {!loading && totalPages > 1 && <nav className="catalog-pagination" aria-label="صفحات المنتجات">
                    <button className="pagination-arrow" disabled={currentPage <= 1} onClick={() => goToCatalogPage(currentPage - 1)} aria-label="الصفحة السابقة"><ArrowLeft size={16} /><span>السابق</span></button>
                    <div className="pagination-numbers">{paginationPages.map((page) => <button key={page} className={`pagination-page ${currentPage === page ? 'active' : ''}`} aria-current={currentPage === page ? 'page' : undefined} onClick={() => goToCatalogPage(page)}>{page.toLocaleString('ar-EG')}</button>)}</div>
                    <button className="pagination-arrow" disabled={currentPage >= totalPages} onClick={() => goToCatalogPage(currentPage + 1)} aria-label="الصفحة التالية"><span>التالي</span><ChevronDown className="pagination-next-icon" size={16} /></button>
                  </nav>}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="orders-page page-container">
            <div className="orders-header"><div><span className="section-kicker">YOUR ACCOUNT</span><h1>طلباتي</h1><p>كل طلباتك السابقة وتفاصيل المنتجات في مكان واحد.</p></div><button className="secondary-btn" onClick={() => { setView('shop'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><ArrowLeft size={17} /> رجوع للمتجر</button></div>
            {ordersError && <div className="inline-error"><AlertCircle size={18} />{ordersError}<button onClick={() => void loadOrders()}>حاول تاني</button></div>}
            {ordersLoading ? <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنحمّل طلباتك...</div> : orders.length === 0 ? (
              <div className="orders-empty"><div className="orders-empty-art"><ClipboardList size={37} /></div><h2>لسه مفيش طلبات</h2><p>لما تعمل أول طلب، تفاصيله هتظهر هنا تلقائيًا.</p><button className="primary-btn" onClick={() => setView('shop')}>اكتشف المنتجات <ArrowLeft size={17} /></button></div>
            ) : (
              <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.id}>
                <div className="order-card-header"><div className="order-id-wrap"><span className="order-icon"><Package size={21} /></span><div><strong>طلب رقم #{order.id}</strong><small>{new Date(order.orderDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</small></div></div><span className={`order-status ${statusClass(order.status)}`}>{statusText(order.status)}</span></div>
                {(order.phoneNumber || order.shippingAddress) && <div className="order-delivery-info">
                  {order.phoneNumber && <div><Phone size={15} /><span><small>هاتف التوصيل</small><strong dir="ltr">{order.phoneNumber}</strong></span></div>}
                  {order.shippingAddress && <div><MapPin size={15} /><span><small>عنوان التوصيل</small><strong>{order.shippingAddress}</strong></span></div>}
                </div>}
                <div className="order-items">{(order.orderItems || []).map((item) => <div className="order-item-row" key={item.id}><div className="order-item-thumb"><Package size={18} /></div><div className="order-item-info"><strong>{item.productName || `منتج #${item.productId}`}</strong><small>الكمية: {item.quantity} × {money(item.unitPrice)}</small></div><strong className="order-item-total">{money(item.quantity * item.unitPrice)}</strong></div>)}</div>
                <div className="order-card-footer"><span>إجمالي الطلب</span><strong>{money(order.totalAmount)}</strong></div><div className="order-card-actions"><button className="secondary-btn" onClick={() => void openOrderDetails(order)}><Eye size={15} /> تفاصيل الطلب من الـ API</button></div>
              </article>)}</div>
            )}
          </section>
        )}
      </main>

      <footer className="site-footer"><div className="page-container footer-inner"><div className="footer-brand"><span className="brand-mark"><ShoppingBag size={21} /></span><span><strong>نُقطة</strong><small>تجربة متجر أبسط</small></span></div><p>واجهة تجريبية لمشروع E-Commerce Management API</p><span className="footer-tech"><span /> متصل بواجهة REST API</span></div><div className="page-container footer-bottom"><span>© {new Date().getFullYear()} نُقطة. جميع الحقوق محفوظة.</span><span>React · TypeScript · Bootstrap</span></div></footer>

      {productDetail && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setProductDetail(null); }}>
        <section className="detail-modal" role="dialog" aria-modal="true" aria-labelledby="product-detail-title">
          <div className="detail-modal-header"><div><span className="section-kicker">PRODUCT DETAILS · API</span><h2 id="product-detail-title">تفاصيل المنتج</h2></div><button className="icon-button" aria-label="إغلاق" onClick={() => setProductDetail(null)}><X size={19} /></button></div>
          {productDetailLoading ? <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنجيب أحدث البيانات من السيرفر...</div> : <>
            <div className={`detail-product-art art-${productDetail.id % 6}`}><Package size={54} /></div>
            <div className="detail-product-content"><div className="detail-title-row"><h3>{productDetail.name}</h3><span className="order-status status-pending">#{productDetail.id}</span></div><p>{productDetail.description || 'لا يوجد وصف للمنتج.'}</p><div className="detail-kv-grid"><div><small>السعر</small><strong>{money(productDetail.price)}</strong></div><div><small>المخزون</small><strong>{Number(productDetail.stockQuantity).toLocaleString('ar-EG')}</strong></div><div><small>التصنيف</small><strong>{categories.find((c) => c.id === productDetail.categoryId)?.name || `#${productDetail.categoryId}`}</strong></div></div>
              <div className="detail-modal-actions"><button className="primary-btn" onClick={() => { const item = productDetail; setProductDetail(null); addToCart(item); }} disabled={productDetail.stockQuantity < 1}>أضف للسلة <ShoppingCart size={16} /></button>{isAdmin && <button className="secondary-btn" onClick={() => { const item = productDetail; setProductDetail(null); openProductEditor(item); }}><Pencil size={15} /> تعديل المنتج</button>}</div>
            </div>
          </>}
        </section>
      </div>}

      {editingProduct && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingProduct(null); }}>
        <section className="detail-modal edit-product-modal" role="dialog" aria-modal="true" aria-labelledby="edit-product-title">
          <div className="detail-modal-header"><div><span className="section-kicker">ADMIN · PRODUCT UPDATE</span><h2 id="edit-product-title">تعديل المنتج #{editingProduct.id}</h2></div><button className="icon-button" aria-label="إغلاق" onClick={() => setEditingProduct(null)}><X size={19} /></button></div>
          <form className="edit-product-form" onSubmit={saveProductEdits}>
            <label>اسم المنتج<input required minLength={2} maxLength={100} value={editProductForm.name} onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })} /></label>
            <label>الوصف<input maxLength={500} value={editProductForm.description} onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })} /></label>
            <div className="form-grid-two"><label>السعر<input type="number" min="0.01" max="1000000" step="0.01" required value={editProductForm.price} onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })} /></label><label>المخزون<input type="number" min="0" max="1000000" step="0.01" required value={editProductForm.stockQuantity} onChange={(e) => setEditProductForm({ ...editProductForm, stockQuantity: e.target.value })} /></label></div>
            <label>التصنيف<select required value={editProductForm.categoryId} onChange={(e) => setEditProductForm({ ...editProductForm, categoryId: e.target.value })}><option value="">اختار تصنيف</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <div className="admin-note"><ShieldCheck size={17} /><span>الحفظ يستخدم PUT /Product/Update. لو الـ API بيرجع نجاحًا من غير تغيير البيانات، صحّح AutoMapper في الـ Backend طبقًا لملف README.</span></div>
            <button className="primary-btn full-btn" disabled={busy}>{busy ? 'جارٍ الحفظ...' : 'حفظ التعديلات'} <Check size={16} /></button>
          </form>
        </section>
      </div>}

      {activeOrderDetail && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setActiveOrderDetail(null); }}>
        <section className="detail-modal order-detail-modal" role="dialog" aria-modal="true" aria-labelledby="order-detail-title">
          <div className="detail-modal-header"><div><span className="section-kicker">ORDER DETAILS · API</span><h2 id="order-detail-title">طلب رقم #{activeOrderDetail.order.id}</h2></div><button className="icon-button" aria-label="إغلاق" onClick={() => setActiveOrderDetail(null)}><X size={19} /></button></div>
          <div className="order-detail-meta"><span className={`order-status ${statusClass(activeOrderDetail.order.status)}`}>{statusText(activeOrderDetail.order.status)}</span><span>{new Date(activeOrderDetail.order.orderDate).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span></div>
          {(activeOrderDetail.order.phoneNumber || activeOrderDetail.order.shippingAddress) && <div className="order-delivery-info order-detail-delivery">
            {activeOrderDetail.order.phoneNumber && <div><Phone size={15} /><span><small>هاتف التوصيل</small><strong dir="ltr">{activeOrderDetail.order.phoneNumber}</strong></span></div>}
            {activeOrderDetail.order.shippingAddress && <div><MapPin size={15} /><span><small>عنوان التوصيل</small><strong>{activeOrderDetail.order.shippingAddress}</strong></span></div>}
          </div>}
          {orderDetailLoading && <div className="orders-loading"><span className="spinner-border spinner-border-sm" /> بنراجع تفاصيل الطلب...</div>}
          <div className="order-detail-lines">{(activeOrderDetail.order.orderItems || []).map((item) => <div className="admin-order-item" key={item.id}><span>{item.productName || `منتج #${item.productId}`}</span><small>{item.quantity} × {money(item.unitPrice)}</small><strong>{money(item.quantity * item.unitPrice)}</strong></div>)}</div>
          <div className="detail-total-row"><span>إجمالي الطلب</span><strong>{money(activeOrderDetail.apiTotal ?? activeOrderDetail.order.totalAmount)}</strong></div>
          {activeOrderDetail.detailNote && <p className="detail-api-note"><AlertCircle size={15} /> {activeOrderDetail.detailNote}</p>}
        </section>
      </div>}

      {cartOpen && <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setCartOpen(false); }}>
        <aside className="cart-drawer" aria-label="سلة التسوق">
          <div className="drawer-header"><div><span className="section-kicker">YOUR SELECTION</span><h2>سلة التسوق <span>({cartCount})</span></h2></div><button className="icon-button" onClick={() => setCartOpen(false)} aria-label="إغلاق السلة"><X size={20} /></button></div>
          {cartItems.length === 0 ? <div className="cart-empty"><span><ShoppingBag size={30} /></span><h3>السلة لسه فاضية</h3><p>ضيف منتجات من المتجر وهتظهر هنا.</p><button className="primary-btn" onClick={() => setCartOpen(false)}>ابدأ التسوق <ArrowLeft size={17} /></button></div> : <>
            <div className="drawer-items">{cartItems.map(({ product, quantity }) => <div className="cart-line" key={product.id}><div className={`cart-thumb art-${product.id % 6}`}><Package size={25} /></div><div className="cart-line-info"><strong>{product.name}</strong><small>{money(product.price)}</small><div className="quantity-stepper"><button aria-label="تقليل الكمية" onClick={() => setCartQuantity(product, quantity - 1)}><Minus size={13} /></button><span>{quantity}</span><button aria-label="زيادة الكمية" disabled={quantity >= product.stockQuantity} onClick={() => setCartQuantity(product, quantity + 1)}><Plus size={13} /></button></div></div><div className="cart-line-end"><strong>{money(product.price * quantity)}</strong><button className="remove-line" aria-label="حذف من السلة" onClick={() => setCartQuantity(product, 0)}><Trash2 size={15} /></button></div></div>)}</div>
            <form className="checkout-form" noValidate onSubmit={(event) => { event.preventDefault(); void handleCheckout(); }}>
              <div className="checkout-fields">
                <div className="checkout-section-heading"><span className="checkout-section-icon"><Truck size={17} /></span><div><strong>بيانات التوصيل</strong><small>اكتب بيانات استلام الطلب</small></div></div>
                <label className="checkout-field"><span>رقم الهاتف <b>*</b></span><input type="tel" inputMode="tel" autoComplete="tel" dir="ltr" required maxLength={20} value={checkoutPhone} onChange={(event) => { setCheckoutPhone(event.target.value); setCheckoutError(''); }} placeholder="01012345678" aria-label="رقم هاتف التوصيل" /></label>
                <label className="checkout-field"><span>عنوان التوصيل بالتفصيل <b>*</b></span><textarea required minLength={10} maxLength={300} rows={3} value={checkoutAddress} onChange={(event) => { setCheckoutAddress(event.target.value); setCheckoutError(''); }} placeholder="المحافظة، المدينة، الشارع، رقم العقار، الدور والشقة" aria-label="عنوان التوصيل" /></label>
                {checkoutError && <div className="checkout-error" role="alert"><AlertCircle size={15} /><span>{checkoutError}</span></div>}
              </div>
              <div className="drawer-summary"><div className="summary-row"><span>عدد المنتجات</span><strong>{cartCount}</strong></div><div className="summary-row total"><span>الإجمالي التقديري</span><strong>{money(cartTotal)}</strong></div><p><ShieldCheck size={15} /> السعر النهائي والمخزون بيتراجعوا من السيرفر وقت تسجيل الطلب.</p><button type="submit" className="primary-btn checkout-btn" disabled={busy}>{busy ? 'جارٍ تأكيد الطلب...' : 'تأكيد الطلب'} <ArrowLeft size={18} /></button><button type="button" className="continue-shopping" onClick={() => setCartOpen(false)}>العودة للتسوق</button></div>
            </form>
          </>}
        </aside>
      </div>}

      {authMode && <AuthModal mode={authMode} setMode={setAuthMode} busy={busy} onLogin={login} onRegister={async (fullName, email, password) => {
        setBusy(true);
        try {
          await api.post('/Auth/Register', { fullName, email, password });
          setNotice('تم إنشاء الحساب. سجّل الدخول بنفس البريد وكلمة المرور.');
          setAuthMode('login');
        } catch (e) { setNotice(getErrorMessage(e)); throw e; }
        finally { setBusy(false); }
      }} />}
    </div>
  );
}

type AuthModalProps = {
  mode: AuthMode;
  setMode: (mode: AuthMode | null) => void;
  busy: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (fullName: string, email: string, password: string) => Promise<void>;
};

function AuthModal({ mode, setMode, busy, onLogin, onRegister }: AuthModalProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await onLogin(email.trim(), password);
      else await onRegister(fullName.trim(), email.trim(), password);
    } catch (e) { setFormError(getErrorMessage(e)); }
    finally { setSubmitting(false); }
  };

  return <div className="overlay auth-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setMode(null); }}>
    <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <button className="modal-close icon-button" onClick={() => setMode(null)} aria-label="إغلاق"><X size={20} /></button>
      <div className="auth-art"><div className="auth-art-circle"><ShoppingBag size={37} /></div><Sparkles className="auth-spark" size={23} /><span className="auth-art-text">تجربة شراء<br />على مزاجك</span></div>
      <div className="auth-form-area"><span className="section-kicker">WELCOME TO NOKTA</span><h2 id="auth-title">{mode === 'login' ? 'أهلاً بعودتك' : 'حساب جديد، بداية أسهل'}</h2><p>{mode === 'login' ? 'سجّل دخولك وكمل تجربة التسوق.' : 'أنشئ حساب عميل وابدأ اختيار منتجاتك.'}</p>
        {formError && <div className="auth-error"><AlertCircle size={16} />{formError}</div>}
        <form onSubmit={submit}>
          {mode === 'register' && <label>الاسم بالكامل<div className="auth-input"><UserRound size={17} /><input required minLength={3} maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="اكتب اسمك" /></div></label>}
          <label>البريد الإلكتروني<div className="auth-input"><span className="at-sign">@</span><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" /></div></label>
          <label>كلمة المرور<div className="auth-input"><ShieldCheck size={17} /><input type="password" required minLength={1} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div></label>
          {mode === 'register' && <div className="customer-role-note"><BadgeCheck size={16} /> الحساب الجديد هيكون Customer، مش Admin.</div>}
          <button className="primary-btn auth-submit" disabled={busy || submitting}>{busy || submitting ? 'جارٍ التنفيذ...' : mode === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'} <ArrowLeft size={18} /></button>
        </form>
        <div className="auth-switch">{mode === 'login' ? 'أول مرة هنا؟' : 'عندك حساب بالفعل؟'} <button onClick={() => { setFormError(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'أنشئ حساب' : 'سجّل الدخول'}</button></div>
        <div className="auth-privacy"><ShieldCheck size={14} /> يتم إرسال بيانات الدخول إلى الـ API الخاص بمشروعك.</div>
      </div>
    </section>
  </div>;
}

export default App;
