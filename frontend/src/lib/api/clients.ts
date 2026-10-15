const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname.endsWith('netlify.app')
    ? "/api"
    : "https://honeyent.up.railway.app/api";

const rawApiUrl = import.meta.env.VITE_API_URL;
const API_URL = normalizeApiUrl(rawApiUrl || defaultApiUrl);

function normalizeApiUrl(url: string): string {
    if (typeof window === 'undefined') return url;

    const fallback = "/api";
    if (!url || url === fallback) return fallback;

    try {
        const parsed = new URL(url, window.location.href);
        const isLocalHost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
        const sameOrigin = parsed.origin === window.location.origin;

        // If build-time env accidentally injected a local dev API URL, prefer same-origin `/api` for browser deployments.
        if (isLocalHost && parsed.pathname === "/api" && !sameOrigin) {
            return fallback;
        }

        return url.replace(/\/$/, "");
    } catch (err) {
        return fallback;
    }
}

function getAuthToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
    const token = getAuthToken();
    const headers: any = { "Content-Type": "application/json" };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${path}`, {
        headers,
        cache: "no-store",
        ...init,
    });

    if (!response.ok) {
        const bodyText = await response.text();
        let message = `API request failed: ${response.status} ${response.statusText}`;
        try {
            const parsed = JSON.parse(bodyText);
            message = parsed.error || parsed.message || message;
        } catch {
            if (bodyText && !bodyText.trim().startsWith('<')) {
                message = bodyText;
            } else if (response.status === 404) {
                message = `API endpoint not found (404) at ${API_URL}${path}. Please verify Railway backend is running.`;
            }
        }
        throw new Error(message);
    }

    return response.json();
}

const mapCustomer = (c: any) => c ? {
    ...c,
    creditLimit: Number(c.creditLimit ?? 0),
    outstanding: Number(c.outstanding ?? 0),
    openingBalance: Number(c.openingBalance ?? 0),
} : c;

const mapSupplier = (s: any) => s ? {
    ...s,
    outstanding: Number(s.outstanding ?? 0),
    openingBalance: Number(s.openingBalance ?? 0),
} : s;

const mapVehicle = (v: any) => v ? {
    ...v,
    capacity: Number(v.capacity ?? 0),
} : v;

const mapOrder = (o: any) => o ? {
    ...o,
    qty: Number(o.qty ?? 0),
    rate: Number(o.rate ?? 0),
    amount: Number(o.amount ?? (o.qty * o.rate) ?? 0),
} : o;

const mapTrip = (t: any) => t ? {
    ...t,
    weight: Number(t.weight ?? 0),
    revenue: Number(t.revenue ?? 0),
    expense: Number(t.expense ?? 0),
    netProfit: Number(t.netProfit ?? 0),
} : t;

const mapWeighSlip = (w: any) => w ? {
    ...w,
    grossWeight: Number(w.grossWeight ?? w.gross ?? 0),
    tareWeight: Number(w.tareWeight ?? w.tare ?? 0),
    netWeight: Number(w.netWeight ?? w.net ?? 0),
    customerWeight: w.customerWeight !== undefined && w.customerWeight !== null ? Number(w.customerWeight) : undefined,
    loss: w.loss !== undefined && w.loss !== null ? Number(w.loss) : undefined,
    gross: Number(w.gross ?? 0),
    tare: Number(w.tare ?? 0),
    net: Number(w.net ?? 0),
} : w;

const mapDeliveryChallan = (d: any) => d ? {
    ...d,
    qty: Number(d.qty ?? 0),
    amount: Number(d.amount ?? 0),
} : d;

const mapInvoice = (i: any) => i ? {
    ...i,
    amount: Number(i.amount ?? 0),
} : i;

const mapPayment = (p: any) => p ? {
    ...p,
    amount: Number(p.amount ?? 0),
    dealId: p.dealId ? String(p.dealId) : undefined,
} : p;

const mapExpense = (e: any) => e ? {
    ...e,
    amount: Number(e.amount ?? 0),
} : e;

const mapExpenseHead = (e: any) => e ? {
    ...e,
    id: String(e.id),
} : e;

const mapHsn = (h: any) => h ? {
    ...h,
    code: h.hsnCode ?? h.code,
    gstRate: Number(h.gstRate ?? 0),
} : h;

const mapProduct = (p: any) => p ? {
    ...p,
    gst: Number(p.gstRate ?? p.gst ?? 0),
    rate: Number(p.defaultRate ?? p.rate ?? 0),
} : p;

const mapDeal = (d: any) => d ? {
    ...d,
    orderQty: d.orderQty !== undefined && d.orderQty !== null ? Number(d.orderQty) : undefined,
    rate: d.rate !== undefined && d.rate !== null ? Number(d.rate) : undefined,
    ourWeight: d.ourWeight !== undefined && d.ourWeight !== null ? Number(d.ourWeight) : undefined,
    customerWeight: d.customerWeight !== undefined && d.customerWeight !== null ? Number(d.customerWeight) : undefined,
    lossWeight: d.lossWeight !== undefined && d.lossWeight !== null ? Number(d.lossWeight) : undefined,
    challanQty: d.challanQty !== undefined && d.challanQty !== null ? Number(d.challanQty) : undefined,
    tripWeight: d.tripWeight !== undefined && d.tripWeight !== null ? Number(d.tripWeight) : undefined,
    tripRevenue: d.tripRevenue !== undefined && d.tripRevenue !== null ? Number(d.tripRevenue) : undefined,
    tripExpense: d.tripExpense !== undefined && d.tripExpense !== null ? Number(d.tripExpense) : undefined,
    salesSubTotal: d.salesSubTotal !== undefined && d.salesSubTotal !== null ? Number(d.salesSubTotal) : undefined,
    salesGstAmount: d.salesGstAmount !== undefined && d.salesGstAmount !== null ? Number(d.salesGstAmount) : undefined,
    salesInvoiceAmount: d.salesInvoiceAmount !== undefined && d.salesInvoiceAmount !== null ? Number(d.salesInvoiceAmount) : undefined,
    purchaseSubTotal: d.purchaseSubTotal !== undefined && d.purchaseSubTotal !== null ? Number(d.purchaseSubTotal) : undefined,
    purchaseGstAmount: d.purchaseGstAmount !== undefined && d.purchaseGstAmount !== null ? Number(d.purchaseGstAmount) : undefined,
    purchaseInvoiceAmount: d.purchaseInvoiceAmount !== undefined && d.purchaseInvoiceAmount !== null ? Number(d.purchaseInvoiceAmount) : undefined,
    totalValue: d.totalValue !== undefined && d.totalValue !== null ? Number(d.totalValue) : undefined,
    receivedAmount: d.receivedAmount !== undefined && d.receivedAmount !== null ? Number(d.receivedAmount) : undefined,
} : d;

const mapWeightHistory = (h: any) => h ? {
    ...h,
    oldQty: Number(h.oldQty ?? 0),
    newQty: Number(h.newQty ?? 0),
    differenceQty: Number(h.differenceQty ?? 0),
    oldAmount: Number(h.oldAmount ?? 0),
    newAmount: Number(h.newAmount ?? 0),
    oldGst: Number(h.oldGst ?? 0),
    newGst: Number(h.newGst ?? 0),
    oldInvoiceAmount: Number(h.oldInvoiceAmount ?? 0),
    newInvoiceAmount: Number(h.newInvoiceAmount ?? 0),
    ourWeight: h.ourWeight !== undefined && h.ourWeight !== null ? Number(h.ourWeight) : undefined,
    customerWeight: h.customerWeight !== undefined && h.customerWeight !== null ? Number(h.customerWeight) : undefined,
    difference: h.difference !== undefined && h.difference !== null ? Number(h.difference) : undefined,
    differencePercent: h.differencePercent !== undefined && h.differencePercent !== null ? Number(h.differencePercent) : undefined,
} : h;


// Auth endpoints
export const login = (username: string, password: string) =>
    fetchJson<{ success: boolean; token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
    });

export const logout = () =>
    fetchJson<{ success: boolean; message: string }>("/auth/logout", { method: "POST" });

export const getCurrentUser = () =>
    fetchJson<any>("/auth/me");

export const getCustomers = () => fetchJson<any[]>("/customers").then(res => Array.isArray(res) ? res.map(mapCustomer) : []);
export const getSuppliers = () => fetchJson<any[]>("/suppliers").then(res => Array.isArray(res) ? res.map(mapSupplier) : []);
export const getProducts = () => fetchJson<any[]>("/products").then(res => Array.isArray(res) ? res.map(mapProduct) : []);
export const getVehicles = () => fetchJson<any[]>("/vehicles").then(res => Array.isArray(res) ? res.map(mapVehicle) : []);
export const getDrivers = () => fetchJson<any[]>("/drivers");
export const getOrders = () => fetchJson<any[]>("/orders").then(res => Array.isArray(res) ? res.map(mapOrder) : []);
export const getTrips = () => fetchJson<any[]>("/trips").then(res => Array.isArray(res) ? res.map(mapTrip) : []);
export const getSalesInvoices = () => fetchJson<any[]>("/invoices/sales").then(res => Array.isArray(res) ? res.map(mapInvoice) : []);
export const getPurchaseInvoices = () => fetchJson<any[]>("/invoices/purchase").then(res => Array.isArray(res) ? res.map(mapInvoice) : []);
export const getWeighSlips = () => fetchJson<any[]>("/weigh-slips").then(res => Array.isArray(res) ? res.map(mapWeighSlip) : []);
export const getDeliveryChallans = () => fetchJson<any[]>("/delivery-challans").then(res => Array.isArray(res) ? res.map(mapDeliveryChallan) : []);

export const createCustomer = (data: Record<string, unknown>) =>
    fetchJson<any>("/customers", { method: "POST", body: JSON.stringify(data) }).then(mapCustomer);
export const updateCustomer = (id: string | number, data: Record<string, unknown>) =>
    fetchJson<any>(`/customers/${String(id)}`, { method: "PUT", body: JSON.stringify(data) }).then(mapCustomer);
export const deleteCustomer = (id: string | number) =>
    fetchJson<any>(`/customers/${String(id)}`, { method: "DELETE" });

export const createSupplier = (data: Record<string, unknown>) =>
    fetchJson<any>("/suppliers", { method: "POST", body: JSON.stringify(data) }).then(mapSupplier);
export const updateSupplier = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapSupplier);
export const deleteSupplier = (id: string) =>
    fetchJson<any>(`/suppliers/${id}`, { method: "DELETE" });

export const createProduct = (data: Record<string, unknown>) =>
    fetchJson<any>("/products", { method: "POST", body: JSON.stringify(data) }).then(mapProduct);
export const updateProduct = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapProduct);
export const deleteProduct = (id: string) =>
    fetchJson<any>(`/products/${id}`, { method: "DELETE" });

export const createVehicle = (data: Record<string, unknown>) =>
    fetchJson<any>("/vehicles", { method: "POST", body: JSON.stringify(data) }).then(mapVehicle);
export const updateVehicle = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/vehicles/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapVehicle);
export const deleteVehicle = (id: string) =>
    fetchJson<any>(`/vehicles/${id}`, { method: "DELETE" });

export const createDriver = (data: Record<string, unknown>) =>
    fetchJson<any>("/drivers", { method: "POST", body: JSON.stringify(data) });
export const updateDriver = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/drivers/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteDriver = (id: string) =>
    fetchJson<any>(`/drivers/${id}`, { method: "DELETE" });

export const createOrder = (data: Record<string, unknown>) =>
    fetchJson<any>("/orders", { method: "POST", body: JSON.stringify(data) }).then(mapOrder);
export const updateOrder = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/orders/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapOrder);
export const deleteOrder = (id: string) =>
    fetchJson<any>(`/orders/${id}`, { method: "DELETE" });
export const updateOrderStatus = (id: string, status: string) =>
    fetchJson<any>(`/orders/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }).then(mapOrder);

export const createTrip = (data: Record<string, unknown>) =>
    fetchJson<any>("/trips", { method: "POST", body: JSON.stringify(data) }).then(mapTrip);
export const updateTrip = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/trips/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapTrip);
export const deleteTrip = (id: string) =>
    fetchJson<any>(`/trips/${id}`, { method: "DELETE" });

export const createWeighSlip = (data: Record<string, unknown>) =>
    fetchJson<any>("/weigh-slips", { method: "POST", body: JSON.stringify(data) }).then(mapWeighSlip);
export const updateWeighSlip = (id: string | number, data: Record<string, unknown>) =>
    fetchJson<any>(`/weigh-slips/${String(id)}`, { method: "PUT", body: JSON.stringify(data) }).then(mapWeighSlip);
export const deleteWeighSlip = (id: string | number) =>
    fetchJson<any>(`/weigh-slips/${String(id)}`, { method: "DELETE" });
export const createDeliveryChallan = (data: Record<string, unknown>) =>
    fetchJson<any>("/delivery-challans", { method: "POST", body: JSON.stringify(data) }).then(mapDeliveryChallan);
export const createDeal = (data: Record<string, unknown>) =>
    fetchJson<any>("/deals", { method: "POST", body: JSON.stringify(data) });
export const updateDeal = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/deals/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const createSalesInvoice = (data: Record<string, unknown>) =>
    fetchJson<any>("/invoices/sales", { method: "POST", body: JSON.stringify(data) }).then(mapInvoice);
export const updateSalesInvoice = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/invoices/sales/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapInvoice);
export const deleteSalesInvoice = (id: string) =>
    fetchJson<any>(`/invoices/sales/${id}`, { method: "DELETE" });

export const createPurchaseInvoice = (data: Record<string, unknown>) =>
    fetchJson<any>("/invoices/purchase", { method: "POST", body: JSON.stringify(data) }).then(mapInvoice);
export const updatePurchaseInvoice = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/invoices/purchase/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapInvoice);
export const deletePurchaseInvoice = (id: string) =>
    fetchJson<any>(`/invoices/purchase/${id}`, { method: "DELETE" });

// Payment endpoints
export const getPayments = () => fetchJson<any[]>("/payments").then(res => Array.isArray(res) ? res.map(mapPayment) : []);
export const getPaymentById = (id: string) => fetchJson<any>(`/payments/${id}`).then(mapPayment);
export const createPayment = (data: Record<string, unknown>) =>
    fetchJson<any>("/payments", { method: "POST", body: JSON.stringify(data) }).then(mapPayment);
export const updatePayment = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/payments/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapPayment);
export const deletePayment = (id: string) =>
    fetchJson<any>(`/payments/${id}`, { method: "DELETE" });

// Expense endpoints
export const getExpenses = () => fetchJson<any[]>("/expenses").then(res => Array.isArray(res) ? res.map(mapExpense) : []);
export const getExpenseById = (id: string) => fetchJson<any>(`/expenses/${id}`).then(mapExpense);
export const createExpense = (data: Record<string, unknown>) =>
    fetchJson<any>("/expenses", { method: "POST", body: JSON.stringify(data) }).then(mapExpense);
export const updateExpense = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/expenses/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapExpense);
export const deleteExpense = (id: string) =>
    fetchJson<any>(`/expenses/${id}`, { method: "DELETE" });

// HSN endpoints
export const getHsnCodes = () => fetchJson<any[]>("/hsn").then(res => Array.isArray(res) ? res.map(mapHsn) : []);
export const createHsnCode = (data: Record<string, unknown>) =>
    fetchJson<any>("/hsn", { method: "POST", body: JSON.stringify(data) }).then(mapHsn);
export const updateHsnCode = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/hsn/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapHsn);
export const deleteHsnCode = (id: string) =>
    fetchJson<any>(`/hsn/${id}`, { method: "DELETE" });

// Company Profile endpoints
export const getCompanyProfile = () => fetchJson<any>("/company-profile");
export const saveCompanyProfile = (data: Record<string, unknown>) =>
    fetchJson<any>("/company-profile", { method: "POST", body: JSON.stringify(data) });

// Deals endpoints
export const getDeals = () => fetchJson<any[]>("/deals").then(res => Array.isArray(res) ? res.map(mapDeal) : []);
export const confirmWeight = (dealId: string | number, data: { customerWeight: number; reason: string; remarks?: string; approvedBy?: string }) =>
    fetchJson<any>(`/deals/${String(dealId)}/confirm-weight`, {
        method: "POST",
        body: JSON.stringify(data),
    });
export const getWeightHistory = (dealId: string | number) =>
    fetchJson<any[]>(`/deals/${String(dealId)}/history`).then(res => Array.isArray(res) ? res.map(mapWeightHistory) : []);
export const getAllWeightHistory = () =>
    fetchJson<any[]>("/deals/history/all").then(res => Array.isArray(res) ? res.map(mapWeightHistory) : []);

// Expense Heads endpoints
export const getExpenseHeads = () => fetchJson<any[]>("/expense-heads").then(res => Array.isArray(res) ? res.map(mapExpenseHead) : []);
export const createExpenseHead = (data: Record<string, unknown>) =>
    fetchJson<any>("/expense-heads", { method: "POST", body: JSON.stringify(data) }).then(mapExpenseHead);
export const updateExpenseHead = (id: string, data: Record<string, unknown>) =>
    fetchJson<any>(`/expense-heads/${id}`, { method: "PUT", body: JSON.stringify(data) }).then(mapExpenseHead);
export const deleteExpenseHead = (id: string) =>
    fetchJson<any>(`/expense-heads/${id}`, { method: "DELETE" });



