# Project Handoff

Last commit: 9a81dd0

## 1. Tóm tắt dự án & Tech Stack
- **Dự án**: Pinterest-Portfolio (Trang portfolio dạng lưới hình ảnh giống Pinterest).
- **Tech Stack**: HTML, CSS, JavaScript thuần (Vanilla JS), Firebase (Firestore, Auth), Cloudinary (lưu trữ ảnh & tối ưu ảnh on-the-fly), Vercel (Serverless Functions).

## 2. Trạng thái hiện tại
- Đã có tính năng upload ảnh lên Cloudinary qua Dashboard.
- Đã có API và giao diện hiển thị thống kê dung lượng Cloudinary trực tiếp trên Dashboard.

## 3. Thay đổi gần nhất
- **01/10/2026**: Cài đặt thư viện `cloudinary` vào package.json để fix lỗi 500 khi Vercel chạy API `cloudinary-usage`. Thêm thuộc tính `autocomplete` vào các ô nhập mật khẩu.
- **01/10/2026**: Thêm Vercel Serverless Function `api/cloudinary-usage.js` để lấy dữ liệu dung lượng Cloudinary bằng Admin API.
- **01/10/2026**: Thêm widget tiến độ dung lượng (Progress Bar) vào `admin/dashboard.html` và fetch/render data trong `src/pages/admin.js`.

## 4. Hướng dẫn cho AI/máy tiếp theo
- Nếu cần chạy local với API Vercel, hãy đảm bảo bạn giả lập serverless hoặc nhắc User deploy lên Vercel. User cần đảm bảo biến môi trường `CLOUDINARY_API_SECRET` được thiết lập trên Vercel.
- Tiếp theo có thể làm tính năng tối ưu nén ảnh phía client (Client-side compression) trước khi upload nếu User yêu cầu.
