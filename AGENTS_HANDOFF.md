# Project Handoff

Last commit: cad048e

## 1. Tóm tắt dự án & Tech Stack
- **Dự án**: Pinterest-Portfolio (Trang portfolio dạng lưới hình ảnh giống Pinterest).
- **Tech Stack**: HTML, CSS, JavaScript thuần (Vanilla JS), Firebase (Firestore, Auth), Cloudinary (lưu trữ ảnh & tối ưu ảnh on-the-fly), Vercel (Serverless Functions).

## 2. Trạng thái hiện tại
- Đã có tính năng upload ảnh lên Cloudinary qua Dashboard.
- Đã có API và giao diện hiển thị thống kê dung lượng Cloudinary trực tiếp trên Dashboard.
- Đã có tính năng chọn Thumbnail tùy chỉnh (Auto, Group 3 ảnh, Ảnh đơn) cho các Section hiển thị dạng dự án hình ảnh.

## 3. Thay đổi gần nhất
- **04/10/2026**: Thêm tính năng cấu hình Thumbnail cho dự án ảnh trên trang chủ. Hỗ trợ 3 chế độ: "Auto" (tự động lấy 3 ảnh đầu), "Group 3" (chọn 3 ảnh tùy chỉnh), và "Single" (chọn 1 ảnh duy nhất hiển thị full khung 3:2). Có nút popup ở cả Project list và Project detail để chọn.
- **04/10/2026**: Tích hợp tính năng Lightbox với độ phân giải màn hình thực tế, tự động fix lỗi ảnh ngang siêu rộng bị vỡ trên màn hình lớn. Tăng chất lượng nén lên 95%.
- **01/10/2026**: Thiết kế lại Widget hiển thị dung lượng Cloudinary trên Dashboard, tách bạch rõ ràng phần "Tổng Credits tiêu thụ" (Progress bar), "Dung lượng Storage đang lưu" (GB) và "Băng thông Bandwidth đã dùng trong 30 ngày qua" (GB) để User dễ theo dõi.
- **01/10/2026**: Sửa lỗi "Cannot read properties of undefined (reading 'toFixed')" khi parse dữ liệu từ Cloudinary Usage API bằng cách đọc `data.credits` thay vì `data.storage` (vì bản free tính giới hạn theo credit). Fix cảnh báo DOM bằng cách thêm hidden username input.
- **01/10/2026**: Cài đặt thư viện `cloudinary` vào package.json để fix lỗi 500 khi Vercel chạy API `cloudinary-usage`. Thêm thuộc tính `autocomplete` vào các ô nhập mật khẩu.
- **01/10/2026**: Thêm Vercel Serverless Function `api/cloudinary-usage.js` để lấy dữ liệu dung lượng Cloudinary bằng Admin API.
- **01/10/2026**: Thêm widget tiến độ dung lượng (Progress Bar) vào `admin/dashboard.html` và fetch/render data trong `src/pages/admin.js`.

## 4. Hướng dẫn cho AI/máy tiếp theo
- Nếu cần chạy local với API Vercel, hãy đảm bảo bạn giả lập serverless hoặc nhắc User deploy lên Vercel. User cần đảm bảo biến môi trường `CLOUDINARY_API_SECRET` được thiết lập trên Vercel.
- Tiếp theo có thể làm tính năng tối ưu nén ảnh phía client (Client-side compression) trước khi upload nếu User yêu cầu.
