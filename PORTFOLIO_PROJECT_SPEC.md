# Đặc Tả Dự Án: Portfolio Cá Nhân Phong Cách Pinterest
> Tài liệu này dành cho Claude Code đọc để hiểu toàn bộ ngữ cảnh dự án trước khi viết code.

---

## 1. MỤC TIÊU DỰ ÁN

**URL Deploy:** https://nguyenminhtri.vercel.app/

Xây dựng một trang **Portfolio cá nhân** hiển thị các project ảnh theo phong cách Pinterest. Người dùng thông thường chỉ xem. Admin (chủ trang) đăng nhập để quản lý nội dung.

**Tham khảo thiết kế:** https://commerce.nuxt.dev/ — trang này có layout gần giống Pinterest (lưới nhiều cột, card bo góc, khoảng cách đều), nhưng là web bán hàng nên có các module cart, product, checkout không cần thiết. Mục tiêu là **lấy ý tưởng CSS/layout** của trang đó (grid system, card style, spacing, typography) và xây lại hoàn toàn cho phù hợp với portfolio.

> **Lưu ý quan trọng:** KHÔNG clone hay fork source code Nuxt Commerce. Chỉ lấy cảm hứng thiết kế rồi build fresh project.

---

## 2. CÔNG NGHỆ ĐỀ XUẤT

### Stack chính
- **Vite** — build tool nhanh, nhẹ, phù hợp project frontend thuần
- **Vanilla JS** (hoặc Vue 3 nếu cần reactive state) — không cần React/Next vì không có SSR requirement
- **Tailwind CSS** — utility-first, dễ custom, phù hợp responsive layout nhanh
- **Firebase** — authentication + Firestore database
- **Cloudinary** — lưu trữ và serve ảnh

### Tại sao Vite + Tailwind thay vì Next.js?
- Project không cần SEO đặc biệt (portfolio cá nhân)
- Không có server-side rendering requirement
- Vite build nhanh hơn, config đơn giản hơn cho project quy mô nhỏ
- Tailwind giúp replicate style Pinterest-like nhanh chóng

### Backend: Vercel Serverless Functions
- **Production URL:** https://nguyenminhtri.vercel.app/
- Đặt trong thư mục `/api/` — Vercel tự nhận và deploy thành endpoint thật
- Dùng để gọi Cloudinary API với API Secret (xoá ảnh) — không bao giờ để Secret ở frontend
- API Secret lưu trong **Vercel Environment Variables**, không commit lên GitHub
- Free hoàn toàn, deploy cùng project, không cần server riêng

---

## 3. CẤU HÌNH SERVICES

### Firebase
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC2NDuJ5EoiCRSzAG7uwti0PKOroFK-0v4",
  authDomain: "portfolio-pinterest-style.firebaseapp.com",
  projectId: "portfolio-pinterest-style",
  storageBucket: "portfolio-pinterest-style.firebasestorage.app",
  messagingSenderId: "3947926345",
  appId: "1:3947926345:web:dc3990605f4acfe7738098"
};
```
**Sử dụng:**
- `Firebase Authentication` — đăng nhập Admin bằng **Google OAuth + email whitelist**
- `Firestore` — lưu metadata project và danh sách ảnh (có thứ tự index)

**Danh sách email được phép đăng nhập (whitelist):**
```javascript
const ALLOWED_EMAILS = [
  "mintri.arena@gmail.com",
  "trixinchao@gmail.com"
];
```

### Cloudinary
```
Cloud Name: dft21ara1
API Key: 333179835848518
API Secret: 1Rh4b73-mybPJGy7Hw7bHzyvzoo
Upload Preset: ml_default
```
**Sử dụng:**
- Upload ảnh từ Admin dashboard
- Serve ảnh tối ưu (auto format, auto quality, resize on-the-fly)
- URL pattern: `https://res.cloudinary.com/dft21ara1/image/upload/{transformations}/{public_id}`

> **Bảo mật:** API Secret KHÔNG được đưa vào frontend code. Chỉ dùng `Upload Preset` (unsigned upload) ở client side.

---

## 4. CẤU TRÚC DỮ LIỆU FIRESTORE

### Collection: `projects`
```
projects/
  {projectId}/
    name: string           // Tên project
    createdAt: timestamp
    order: number          // Thứ tự hiển thị trên trang chủ

    images/                // Sub-collection
      {imageId}/
        cloudinaryId: string   // public_id trên Cloudinary
        url: string            // URL đầy đủ
        width: number          // Chiều rộng gốc (px)
        height: number         // Chiều cao gốc (px)
        order: number          // Thứ tự trong project (quan trọng cho Mosaic Grid)
        createdAt: timestamp
```

---

## 5. GIAO DIỆN TRANG CHỦ — Project List

### Layout tổng thể
- Lưới đa cột, responsive (2 cột mobile → 3 cột tablet → 4-5 cột desktop)
- **`--global-gap: 16px`** — biến CSS duy nhất kiểm soát toàn bộ khoảng cách, dùng cho cả trang chủ lẫn trang chi tiết

### Mỗi Project Card
Cấu trúc 1 card gồm:

**Phần thumbnail (tỉ lệ 3:2):**
```
┌─────────────┬──────┐
│             │  [2] │
│    [1]      ├──────┤
│             │  [3] │
└─────────────┴──────┘
```
- Khung tổng thể: `aspect-ratio: 3/2`, `border-radius: 12px`, `overflow: hidden`
- `[1]` Hình lớn bên trái: `grid-column: 1`, `grid-row: span 2`, chiếm 2/3 chiều rộng
- `[2]` + `[3]` hai hình nhỏ bên phải: mỗi hình chiếm 1/2 chiều cao, 1/3 chiều rộng
- Dữ liệu: lấy **3 ảnh đầu tiên** (order: 0, 1, 2) trong sub-collection `images` của project đó
- Nếu project có ít hơn 3 ảnh: placeholder màu xám nhạt cho ô trống

```css
.project-thumb {
  display: grid;
  grid-template-columns: 2fr 1fr;
  grid-template-rows: 1fr 1fr;
  aspect-ratio: 3 / 2;
  gap: 4px; /* gap nhỏ bên trong thumbnail, tách biệt với --global-gap */
  overflow: hidden;
  border-radius: 12px;
}
.thumb-img-large { grid-row: span 2; }
.thumb-img, .thumb-img-large { width: 100%; height: 100%; object-fit: cover; }
```

**Phần text bên dưới:**
- Tên project: font weight 600, margin-top bằng `--global-gap / 2`
- Số lượng ảnh (tùy chọn): màu xám nhạt, font nhỏ hơn

### Hành vi
- Click vào card → navigate đến `/project/{projectId}`
- Hover: nhẹ scale lên hoặc overlay tối nhẹ trên thumbnail

---

## 6. GIAO DIỆN TRANG CHI TIẾT — Dynamic Mosaic Grid

### Bài toán
Hiển thị toàn bộ ảnh của 1 project với **layout xếp gạch thông minh** — ảnh có tỉ lệ ngẫu nhiên (đứng, ngang, vuông, dẹp) phải lấp đầy lưới không để khoảng trắng thừa.

### Giải pháp kỹ thuật: CSS Grid + `grid-auto-flow: dense` + JS span calculator

**Grid container:**
```css
.mosaic-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 4), 1fr);
  grid-auto-rows: var(--row-unit, 80px); /* đơn vị hàng cơ bản */
  gap: var(--global-gap, 16px);
  grid-auto-flow: dense; /* từ khóa cốt lõi: tự lấp đầy ô trống */
}
```

**JS tính `grid-column-span` và `grid-row-span` theo aspect ratio:**
```javascript
function calculateSpans(width, height, cols = 4) {
  const ratio = width / height;

  if (ratio >= 1.6) {
    // Hình ngang rộng → chiếm 2 cột
    return { colSpan: 2, rowSpan: 1 };
  } else if (ratio <= 0.7) {
    // Hình dọc → chiếm 2 hàng
    return { colSpan: 1, rowSpan: 2 };
  } else if (ratio >= 0.9 && ratio <= 1.1) {
    // Gần vuông → 1x1
    return { colSpan: 1, rowSpan: 1 };
  } else {
    // Các trường hợp khác: tính theo tỉ lệ
    return { colSpan: 1, rowSpan: Math.round(1 / ratio) || 1 };
  }
}
```

**Áp dụng cho mỗi ảnh:**
```javascript
images.forEach(img => {
  const { colSpan, rowSpan } = calculateSpans(img.width, img.height);
  const el = document.createElement('div');
  el.style.gridColumn = `span ${colSpan}`;
  el.style.gridRow = `span ${rowSpan}`;
  // ...
});
```

> `grid-auto-flow: dense` sẽ tự động nhấc các ảnh nhỏ hơn ở phía sau lên lấp vào khoảng trống mà ảnh lớn để lại, bất kể thứ tự DOM. Đây là cơ chế cốt lõi tạo ra hiệu ứng mosaic.

### Khoảng cách
- `gap` trong mosaic grid = `var(--global-gap)` — đồng bộ tuyệt đối với trang chủ

---

## 7. HỆ THỐNG ADMIN

### Đăng nhập
- Route: `/admin/login`
- Phương thức: **Google OAuth** (Firebase Authentication với GoogleAuthProvider)
- Sau khi Google login thành công → kiểm tra email có trong whitelist không
- Nếu email **không hợp lệ** → `signOut()` ngay lập tức + hiển thị thông báo lỗi
- Nếu email **hợp lệ** → redirect đến `/admin/dashboard`
- Lưu auth state với `onAuthStateChanged`

```javascript
import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const ALLOWED_EMAILS = [
  "mintri.arena@gmail.com",
  "trixinchao@gmail.com"
];

async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  if (!ALLOWED_EMAILS.includes(user.email)) {
    await signOut(auth);
    throw new Error("Email này không có quyền truy cập admin.");
  }
  // Login thành công → redirect
  window.location.href = "/admin/dashboard";
}
```

### Admin Dashboard — Quản lý Projects
Các chức năng CRUD:

**Tạo project mới:**
- Form: nhập tên project → tạo document trong Firestore

**Xoá project:**
- Xoá document project + toàn bộ sub-collection images trong Firestore
- Gọi Vercel Serverless Function `/api/delete-image` để xoá ảnh trên Cloudinary (API Secret chỉ nằm ở server)

**Vercel Serverless Function xoá ảnh (`/api/delete-image.js`):**
```javascript
// api/delete-image.js — chạy trên Vercel server, KHÔNG phải browser
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "dft21ara1",
  api_key: "333179835848518",
  api_secret: process.env.CLOUDINARY_API_SECRET // lưu trong Vercel Env Variables
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { publicId } = req.body;
  // TODO: verify Firebase ID token từ header trước khi xoá
  await cloudinary.uploader.destroy(publicId);
  res.status(200).json({ success: true });
}
```

**Thêm ảnh vào project:**
- Upload file lên Cloudinary dùng **Unsigned Upload** với preset `ml_default`
```javascript
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'ml_default');

  const res = await fetch(
    'https://api.cloudinary.com/v1_1/dft21ara1/image/upload',
    { method: 'POST', body: formData }
  );
  const data = await res.json();
  return {
    cloudinaryId: data.public_id,
    url: data.secure_url,
    width: data.width,
    height: data.height
  };
}
```
- Sau khi upload xong → lưu metadata vào Firestore với `order` = số lượng ảnh hiện tại

**Xoá ảnh khỏi project:**
- Xoá document trong sub-collection `images`
- Cập nhật lại `order` của các ảnh còn lại

### Sắp xếp thứ tự ảnh (Drag & Drop)
- Dùng thư viện **SortableJS** (nhẹ, không dependency)
- Hiển thị ảnh dạng lưới nhỏ trong admin, có thể kéo thả
- Khi thả xong: cập nhật lại trường `order` cho toàn bộ ảnh trong Firestore (batch write)
- Lưu ý: trong trang xem public, Mosaic Grid đọc ảnh theo `order` → thứ tự kéo thả sẽ ảnh hưởng đến cách grid tính toán span và sắp xếp ảnh

```javascript
// SortableJS callback
onEnd: async (evt) => {
  // Cập nhật mảng order
  const batch = db.batch();
  sortedImages.forEach((img, index) => {
    const ref = doc(db, 'projects', projectId, 'images', img.id);
    batch.update(ref, { order: index });
  });
  await batch.commit();
}
```

---

## 8. CẤU TRÚC FILE DỰ ÁN (Đề xuất)

```
portfolio/
├── api/
│   └── delete-image.js     # Vercel Serverless Function — xoá ảnh Cloudinary
├── index.html              # Trang chủ - danh sách projects
├── project.html            # Trang chi tiết - mosaic grid
├── admin/
│   ├── login.html          # Trang đăng nhập (Google OAuth)
│   └── dashboard.html      # Admin dashboard
├── src/
│   ├── main.js             # Entry point, Firebase init
│   ├── firebase.js         # Firebase config & helpers
│   ├── cloudinary.js       # Cloudinary upload helpers (unsigned)
│   ├── auth.js             # Google login + whitelist check
│   ├── pages/
│   │   ├── home.js         # Logic trang chủ
│   │   ├── project.js      # Logic mosaic grid
│   │   └── admin.js        # Logic admin dashboard
│   └── styles/
│       ├── main.css        # CSS variables, reset, base
│       ├── grid.css        # Mosaic grid styles
│       └── admin.css       # Admin-specific styles
├── .env                    # KHÔNG commit — chứa CLOUDINARY_API_SECRET
├── .gitignore              # Phải include .env
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 9. BIẾN CSS TOÀN CỤC

```css
:root {
  --global-gap: 16px;       /* Khoảng cách dùng cho cả 2 trang */
  --grid-cols: 4;           /* Số cột mosaic (thay đổi theo breakpoint) */
  --row-unit: 80px;         /* Đơn vị hàng cơ bản cho mosaic grid */
  --radius-card: 12px;      /* Bo góc card */
  --color-bg: #f8f8f8;      /* Nền trang */
  --color-text: #111;
  --color-text-muted: #999;
}

@media (max-width: 768px) {
  :root {
    --global-gap: 8px;
    --grid-cols: 2;
    --row-unit: 60px;
  }
}
```

---

## 10. CHECKLIST PHÁT TRIỂN

- [ ] Init Vite project + cài Tailwind CSS
- [ ] Cài Firebase SDK, kết nối Firestore + Auth (bật Google provider trong Firebase Console)
- [ ] Trang chủ: fetch projects, render card thumbnail 3:2
- [ ] Trang chi tiết: fetch images theo order, render mosaic grid với dense flow
- [ ] Admin login: Google OAuth + kiểm tra email whitelist
- [ ] Admin dashboard: CRUD projects
- [ ] Admin upload ảnh: Cloudinary unsigned upload → lưu width/height/url vào Firestore
- [ ] Admin xoá ảnh: gọi Vercel Serverless Function `/api/delete-image`
- [ ] Admin drag & drop: SortableJS + batch Firestore update
- [ ] Responsive: 2 col mobile, 3 col tablet, 4+ col desktop
- [ ] Loading states và error handling
- [ ] Thêm `.env` vào `.gitignore`
- [ ] Cấu hình Vercel Environment Variables: `CLOUDINARY_API_SECRET`
- [ ] Deploy lên Vercel (connect GitHub repo)

---

## 11. LƯU Ý QUAN TRỌNG CHO CLAUDE CODE

1. **API Secret Cloudinary** KHÔNG được xuất hiện trong frontend code hay commit lên GitHub. Chỉ dùng `upload_preset: 'ml_default'` (unsigned) ở client. API Secret chỉ dùng trong `/api/delete-image.js` qua `process.env.CLOUDINARY_API_SECRET`.

2. **Google OAuth setup:** Vào Firebase Console → Authentication → Sign-in method → bật Google provider. Thêm `nguyenminhtri.vercel.app` vào "Authorized domains" sau khi deploy (URL: https://nguyenminhtri.vercel.app/).

3. **Firestore Security Rules** — chặt chẽ hơn: write chỉ cho 2 email whitelist cụ thể:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null &&
        request.auth.token.email in [
          "mintri.arena@gmail.com",
          "trixinchao@gmail.com"
        ];
    }
  }
}
```

4. **Verify Firebase token trong Vercel Function:** Trước khi cho xoá ảnh Cloudinary, `/api/delete-image.js` nên verify Firebase ID token gửi từ client trong Authorization header để tránh ai đó gọi thẳng API.

5. **`grid-auto-flow: dense`** có thể thay đổi thứ tự hiển thị DOM để lấp khoảng trống — đây là hành vi mong muốn, không phải bug.

6. **Thứ tự ảnh** trong Firestore (`order` field) quyết định thuật toán mosaic sẽ xử lý ảnh nào trước. Khi admin kéo thả, cập nhật đúng field này.

7. Khi fetch ảnh để hiển thị thumbnail trang chủ: chỉ cần lấy **3 ảnh đầu tiên** (`orderBy('order').limit(3)`), không fetch toàn bộ.

8. Mosaic grid đọc `width` và `height` từ Firestore (đã lưu lúc upload từ response Cloudinary) để tính span — KHÔNG dùng `naturalWidth/naturalHeight` từ DOM vì chậm và gây layout shift.
