# Adding and Changes by Jatin

This document maintains a chronological record of all features, changes, and enhancements added to the MMMK project. Future updates and reports can be appended here.

---

## [Phase 1] Sales & Reports Section Implementation

### 1. Overview
A new **Sales & Reports** section has been added to the MMMK Admin Panel. It provides real-time, read-only analytics using real historical store data without any mock data or database risks.

**Sidebar Navigation Order:**
...
- **Orders**
- **Sales & Reports**
  - **Best Selling Products** (`/admin/reports/best-selling`)
  - **Most Viewed Products** (`/admin/reports/most-viewed`)
  - **Traffic Sources** (`/admin/reports/traffic-sources`)
  - **Abandoned Carts** (`/admin/reports/abandoned-carts`)
- **Email Template**
...

---

### 2. KPI / Stat Cards Rule

| Page | KPI Cards Status | Details |
| :--- | :--- | :--- |
| **Best Selling Products** | **NO (0 Cards)** | Clean layout focused purely on the sales & revenue table |
| **Most Viewed Products** | **NO (0 Cards)** | Clean layout focused purely on the views analytics table |
| **Traffic Sources** | **NO (0 Cards)** | Only Donut chart distribution & Channel breakdown table |
| **Abandoned Carts** | **NO (0 Cards)** | Hidden via `showKpiCards={false}`; full table & drawer preserved |

---

### 3. Files Created & Modified

#### Backend Files
- **`backend/Models/TrafficVisit.js`** *(Created)*: Additive Mongoose schema tracking incoming traffic visits (channel, source, referrer, session).
- **`backend/Controller/admin-controllers/analytics/productPerformance.controller.js`** *(Modified)*:
  - Added `totalProducts` and overall `topProduct` to `getSalesPerformance` summary response.
  - Added `getTrafficSources`: Read-only aggregation computing channel counts, share %, and period comparison.
  - Added `recordTrafficVisit`: Non-blocking traffic classifier (Direct, Search, Social, Referral) with 30-minute session debouncing.
- **`backend/Routes/analytics.router.js`** *(Modified)*: Registered `GET /traffic-sources` (Admin protected).
- **`backend/Routes/non-auth-routes/locale.routes.js`** *(Modified)*: Registered `POST /traffic-record` for visitor attribution.

#### Frontend Files
- **`frontend/src/Admin/pages/Reports/BestSellingProductsPage.jsx`** *(Created)*: Best selling report with date range filtering, metric toggle, table, and CSV export (no KPI cards).
- **`frontend/src/Admin/pages/ProductPerformance/ProductPerformance.jsx`** *(Modified)*: Removed metric cards for a clean table layout.
- **`frontend/src/Admin/pages/Reports/MostViewedProductsPage.jsx`** *(Created)*: Clean most-viewed analytics table without KPI cards, with date range filtering and CSV export.
- **`frontend/src/Admin/pages/ProductViews/ProductViewsPage.jsx`** *(Modified)*: Removed metric cards to keep view analytics clean.
- **`frontend/src/Admin/pages/Reports/TrafficSourcesPage.jsx`** *(Created)*: Traffic distribution Donut chart, channel breakdown table, and honest empty state (no KPI cards).
- **`frontend/src/Admin/pages/AbandonedCart/AbandonedCartPage.jsx`** *(Modified)*: Added `showKpiCards={false}` default to hide KPI cards while preserving all recovery data, filters, and detail drawer.
- **`frontend/src/Admin/UI/AdminSidebar.jsx`** *(Modified)*: Grouped the 4 pages under a collapsible "Sales & Reports" menu item, removed redundant standalone entries.
- **`frontend/src/router/AdminRouter.jsx`** *(Modified)*: Added `/admin/reports/*` routes and preserved backward-compatible legacy routes with `showKpiCards={false}`.
- **`frontend/src/apis/admin/analytics.js`** *(Modified)*: Added `getTrafficSources()` API caller.
- **`frontend/src/utils/trafficTracker.js`** *(Created)*: Client-side visitor traffic detector (debounced per session, excludes `/admin`).
- **`frontend/src/utils/exportCsv.js`** *(Created)*: Lightweight, zero-dependency UTF-8 CSV export utility.
- **`frontend/src/Admin/UI/Buttons.jsx`** *(Modified)*: Added reusable `ExportButton` component.
- **`frontend/src/layout/RootLayout.jsx`** *(Modified)*: Triggered `trackVisitorTraffic()` on storefront mount.

---

### 4. Features & Page Details

#### 1. Best Selling Products
- **Clean Layout**: Zero KPI cards.
- **Data Source**: Historical `Order` collection line items (`products.amount * effectiveRate`). Only counts valid orders (`paymentStatus: "Paid"` or completed COD).
- **Features**: Date range filter, Units Sold vs Revenue toggle, column sorting, pagination, refresh, and CSV export.

#### 2. Most Viewed Products
- **Clean Layout**: Zero KPI cards.
- **Data Source**: Existing `ProductView` collection.
- **Features**: Date range filter, view count ranking, product preview & SKU, price, status, pagination, refresh, and CSV export.

#### 3. Traffic Sources
- **Clean Layout**: Zero KPI cards.
- **Visuals**:
  - Donut Chart: Channel share visualization using existing MMMK `DonutChart` (ApexCharts).
  - Channel Breakdown Table: Direct, Search, Social, Referral with Visits, Share %, Period Change %, and Visual Distribution bar.
- **Zero Mock Data**: Uses real `TrafficVisit` collection. Displays an honest empty state when no traffic is recorded for the period.

#### 4. Abandoned Carts
- **Preserved Engine**: Reuses MMMK's existing `AbandonedCartRecovery` system completely intact (no recovery scheduler or coupon changes).
- **Reporting View**: KPI cards hidden via `showKpiCards={false}`. Retains full table, search, filters, and customer detail drawer.

---

### 5. Traffic Source Tracking Flow Fix
- **Backend API URL Resolution**: Updated `trafficTracker.js` to import `API_URL` from `./api.js` ensuring accurate target endpoint resolution in both development (`http://localhost:3001`) and production.
- **Session Tracking Reliability**: Changed `sessionStorage.setItem` to execute only after `response?.data?.success` succeeds.
- **Storefront Route Tracking**: In `RootLayout.jsx`, updated `useEffect` to watch `[pathname]`, triggering visitor tracking on storefront route navigation while strictly skipping `/admin/*`.
- **Response Contract Alignment**: In `productPerformance.controller.js` and `TrafficSourcesPage.jsx`, aligned response properties (`totalVisits` and `distribution` / `channels`) so real traffic data renders properly in both the chart and the performance table.

---

### 6. UI/UX Consistency & Safety
- Fully styled with existing MMMK Admin design tokens, Ant Design components, and color palette.
- Responsive across desktop and mobile screens.
- Zero external libraries installed.
- 100% read-only database operations for reporting safety.

---

### 7. Traffic Sources Page Redesign (Sheetal Admin UX Structure + MMMK Visual Identity)
- **File**: `frontend/src/Admin/pages/Reports/TrafficSourcesPage.jsx`
- **4 Real-Data KPI Cards**:
  1. **Total Visits**: Real total visitor sessions in selected range (`totalVisits.toLocaleString()`, 0 if none).
  2. **Top Source**: Channel with highest traffic (`Direct`, `Search`, `Social`, or `Referral`, or `—` if 0).
  3. **Top Source Share**: Percentage of total traffic for leading channel (`X.X%`, or `0%` if 0).
  4. **Tracked Channels**: Number of channels capturing real traffic (`X of 4 total`, or `0` if 0).
- **Synchronized Date Filtering**: Date range selector (Today, Last 7 Days, Last 30 Days, This Month, Last Month, All Time, Custom Range) dynamically updates all 4 KPI cards, the donut chart, and the channel performance table simultaneously.
- **Main Analytics (Donut Chart)**:
  - ApexCharts donut visualization with center label: "Total" and `<number of visits>` formatted cleanly with `toLocaleString()`.
  - Clean white slice dividers, light theme tooltips, and responsive sizing.
  - Custom channel pills grid below donut showing channel color dot, name, visit count, and share %.
  - Honest, clean Ant Design Empty state when total visits = 0 (no fake slices or mock percentages).
- **Channel Performance Breakdown Table**:
  - Columns: Channel (with icon badge & description), Visits, Share %, Period Change % (real previous-period comparison), Distribution progress bar.
  - Channels: Direct, Search, Social, Referral.
  - Sorters on Channel, Visits, and Share.
  - Horizontal scroll protection (`scroll={{ x: 540 }}`) preventing page overflow on smaller devices.
- **Responsive Layout**:
  - Desktop: 4 KPI cards in a single row; Donut chart (5 cols) and Channel Performance table (7 cols) side-by-side in balanced executive layout.
  - Tablet/Mobile: KPI cards stack cleanly; Donut chart and Channel table stack vertically with scrollable table container.
- **Strict Production Database Safety**: 100% read-only analytics queries; zero fake/mock data; no destructive operations.

---

### 8. KPI Cards Added to Best Selling Products and Abandoned Carts
- **Design Alignment**: Both pages now feature the exact same KPI card layout, responsive grid (`grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`), typography, icon badges, borders, and hover shadows as the Traffic Sources page.
- **Best Selling Products** (`BestSellingProductsPage.jsx` & `ProductPerformance.jsx`):
  1. **Total Products**: `Number(summary.totalProducts || 0).toLocaleString()` — Distinct sold products count.
  2. **Total Units Sold**: `Number(summary.totalUnitsSold || 0).toLocaleString()` — Total units sold across orders.
  3. **Total Revenue**: `formatPrice(summary.totalRevenue || 0)` — Verified sales revenue.
  4. **Top Product**: Top product title & units sold subtitle (or `—` / `No sales recorded` if none).
- **Abandoned Carts** (`AbandonedCartPage.jsx`):
  1. **Total Carts**: `Number(stats.totalCarts || 0).toLocaleString()` — Total tracked customer carts.
  2. **Active / Idle Carts**: `Number((stats.activeCarts || 0) + (stats.idleCarts || 0)).toLocaleString()` — Detailed active (<2h) and idle (2h+) counts.
  3. **Recovery Rate**: `${Number(stats.recoveryRate || 0).toFixed(1)}%` — Recovery percentage and recovered carts count.
  4. **Recovered Revenue**: `AED ${Number(stats.recoveredRevenue || 0).toLocaleString()}` — Actual revenue saved via recovery sequences.
- **Scope & Safety**: Zero changes made to Traffic Sources, Most Viewed Products, or backend logic. All data sources are 100% read-only with real database figures.

