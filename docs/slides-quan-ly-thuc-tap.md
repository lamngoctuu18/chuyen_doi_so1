# Hệ thống Quản lý Thực Tập — Slide Deck (Ngắn gọn)

## 1. Tiêu đề
- Đề tài: Hệ thống Quản lý Thực Tập theo đợt
- Người thực hiện: [Tên]
- Thời lượng: ~10 phút + Q&A

## 2. Đặt vấn đề (Motivation)
- Quy mô lớn, nhiều vai trò (SV–GV–DN–Phòng ban), quản lý theo đợt/batch
- Excel/Form phân tán → dễ sai lệch, khó truy vết/tổng hợp
- Cần hệ thống tập trung, chuẩn hóa quy trình & dữ liệu

## 3. Các nghiên cứu/giải pháp liên quan
- LMS/SIS: mạnh về giao–nộp/chấm hoặc hồ sơ; thiếu linh hoạt cho “đợt thực tập”
- Google Form + Sheets: nhanh/rẻ; phân tán, thiếu phân quyền/audit
- Giải pháp chuyên dụng: có workflow sẵn; hạn chế tùy biến/chi phí tích hợp

## 4. Khoảng trống & Đóng góp
- Khoảng trống: thiếu giải pháp gọn nhẹ, chuyên sâu “batch + report batches”, import chuẩn hóa
- Đóng góp: kiến trúc tách lớp; pipeline import/validate; phân quyền rõ; Swagger API

## 5. Bài toán & Mục tiêu
- Bài toán: đăng ký theo đợt, quản vai trò, nộp/chấm báo cáo, import lớn
- Mục tiêu: UX tốt cho Admin/SV/GV/DN; giảm lỗi; dễ mở rộng/bảo trì

## 6. Vai trò người dùng
- Admin: quản đợt/batch, tài khoản, DN, tổng hợp
- SV: đăng ký, lịch sử, nộp báo cáo theo lô
- GV: quản SV hướng dẫn, duyệt/chấm, đánh giá DN
- DN: xác nhận & đánh giá (khi kích hoạt)

## 7. Kiến trúc tổng thể
- Frontend: React + TypeScript + Vite + TailwindCSS (`quanly-thuctap/`)
- Backend: Node.js + Express + SQL (`backend/`), REST JSON, Swagger docs
- Lưu trữ: CSDL quan hệ + thư mục uploads

## 8. Công nghệ
- FE: React, TS, Vite, Tailwind
- BE: Node.js, Express, SQL, migrations (`backend/migrations/`)
- Tiện ích: Swagger, scripts import/seed, uploads

## 9. Tính năng theo vai trò
- Admin: đợt thực tập, lô báo cáo, duyệt DN, import dữ liệu
- SV: đăng ký theo thời gian; lịch sử; nộp báo cáo
- GV: SV hướng dẫn; duyệt/chấm; đánh giá
- DN: xác nhận & đánh giá (tùy chọn)

## 10. Luồng đăng ký thực tập (SV)
- Trong khung thời gian → nhập thông tin/nguyện vọng
- Gửi đăng ký → lưu `internship_registration` → xem lịch sử/tình trạng

## 11. Quản trị đợt & lô báo cáo
- Tạo/sửa đợt; cấu hình mở/đóng đăng ký
- Tạo report batches; theo dõi nộp/đạt

## 12. Nhập liệu & Đồng bộ (Excel/Google Form)
- Import tài khoản/sinh viên/phân công; template chuẩn
- Validate header/định dạng; log lỗi chi tiết

## 13. Nộp báo cáo, chấm điểm, đánh giá
- SV nộp theo lô; upload file
- GV duyệt/chấm; phản hồi; đánh giá DN

## 14. CSDL & Migrations
- Bảng: `accounts`, tách vai trò, `sinh_vien_huong_dan`, `bao_cao`, `internship_registration`
- Cập nhật: migrations/updates; seed/reset nhanh

## 15. API & Bảo mật
- REST API có tài liệu Swagger (`backend/SWAGGER_API_DOCS.md`)
- Phân quyền theo vai trò; reset mật khẩu; kiểm soát upload

## 16. Giao diện & UX
- Pages theo vai trò; components tái sử dụng (modals, tooltips, layout)
- Notification context; Tailwind UI thống nhất

## 17. Demo kịch bản (3–4 phút)
- Admin: đăng nhập → tạo đợt → mở đăng ký → import SV
- SV: đăng nhập → đăng ký → lịch sử → nộp 1 báo cáo
- GV: đăng nhập → xem SV hướng dẫn → duyệt/chấm 1 báo cáo

## 18. Thách thức & Cách giải
- Excel không đồng nhất → tách import, validate header, template
- Phân quyền đa vai trò → middleware & tách bảng
- Theo đợt/batch → mô hình “batch + report batches”

## 19. Kết quả & Lợi ích
- Tự động hóa quy trình; giảm lỗi nhập liệu
- Quản trị tập trung; dữ liệu thống nhất
- Sẵn sàng mở rộng

## 20. Kế hoạch phát triển
- Dashboard realtime; thông báo email/sự kiện
- Hoàn thiện vai trò DN; logs/audit
- CI/CD & container hóa

## 21. Tổng kết & Q&A
- Giải quyết bài toán quản lý theo đợt/batch; kiến trúc tách lớp, tài liệu API đầy đủ
- Mời câu hỏi/trao đổi