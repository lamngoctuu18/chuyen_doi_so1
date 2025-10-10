# Professional Vietnamese University Design System

## 🎨 Tổng Quan (Overview)

Hệ thống thiết kế chuyên nghiệp được xây dựng dựa trên các nguyên tắc thiết kế của các cổng thông tin giáo dục đại học tại Việt Nam, tập trung vào tính chuyên nghiệp, dễ đọc, và trải nghiệm người dùng tối ưu.

---

## 📝 Hệ Thống Font Chữ (Typography)

### Font Families
- **Primary Font**: `Inter` - Font hiện đại, dễ đọc cho văn bản chính
- **Display Font**: `Lexend` - Font chuyên nghiệp cho tiêu đề
- **Features**: 
  - Font rendering tối ưu với `antialiased`
  - Font smoothing cho macOS
  - Letter spacing âm (-0.02em) cho tiêu đề

### Font Sizes
```css
xs: 0.75rem (12px)    - Văn bản phụ nhỏ
sm: 0.875rem (14px)   - Văn bản phụ
base: 0.9375rem (15px) - Văn bản chính (tăng từ 14px)
lg: 1.125rem (18px)   - Văn bản lớn
xl: 1.25rem (20px)    - Tiêu đề nhỏ
2xl: 1.5rem (24px)    - Tiêu đề trung
3xl: 1.875rem (30px)  - Tiêu đề lớn
4xl: 2.25rem (36px)   - Tiêu đề chính
5xl: 3rem (48px)      - Tiêu đề hero
```

---

## 🎨 Bảng Màu (Color Palette)

### Primary Colors (Màu Chính - Xanh Dương Chuyên Nghiệp)
```
primary-500: #0052CC - Màu chính (University Blue)
primary-600: #003D99 - Màu đậm
primary-700: #002966 - Màu tối
```
**Sử dụng**: Nút chính, liên kết, tiêu đề quan trọng, viền focus

### Secondary Colors (Màu Phụ - Cam Đại Nam)
```
secondary-500: #FF8B00 - Màu nhấn (Đại Nam Orange)
secondary-600: #CC6F00 - Màu đậm
secondary-700: #994F00 - Màu tối
```
**Sử dụng**: Nút phụ, nhấn mạnh, cảnh báo tích cực

### Accent Colors (Màu Nhấn - Xanh Ngọc)
```
accent-500: #00B8D4 - Màu nhấn bổ sung
accent-600: #008BA3 - Màu đậm
```
**Sử dụng**: Thông tin, trạng thái đang xử lý

### Semantic Colors (Màu Ngữ Nghĩa)
```
success-500: #00C853 - Thành công (Xanh lá)
warning-500: #FFB300 - Cảnh báo (Vàng)
error-500: #D32F2F - Lỗi (Đỏ)
info-500: #2196F3 - Thông tin (Xanh)
```

### Text Colors (Màu Văn Bản)
```
text-primary: #172B4D - Văn bản chính (đậm, dễ đọc)
text-secondary: #5E6C84 - Văn bản phụ
text-tertiary: #8993A4 - Văn bản mờ
```

### Background Colors (Màu Nền)
```
bg-primary: #FFFFFF - Nền chính (trắng)
bg-secondary: #F4F5F7 - Nền phụ (xám nhạt)
bg-tertiary: #EBECF0 - Nền tertiary (xám)
```

### Border Colors (Màu Viền)
```
border: #DFE1E6 - Viền mặc định
border-focus: #4C9AFF - Viền khi focus
```

---

## 🔲 Components & Styles

### Professional Buttons

#### Primary Button (`.btn-primary`)
```css
- Background: Gradient xanh dương (Primary → Primary Dark)
- Shadow: 0 4px 12px rgba(0, 82, 204, 0.25)
- Padding: 0.75rem × 1.5rem
- Border Radius: 0.75rem (12px)
- Font Weight: 600
- Hover: Nâng lên -2px, shadow tăng
```

#### Secondary Button (`.btn-secondary`)
```css
- Background: Gradient cam (Secondary → Secondary Dark)
- Shadow: 0 4px 12px rgba(255, 139, 0, 0.25)
- Tương tự Primary nhưng màu cam
```

### Professional Cards (`.card`)
```css
- Background: Trắng
- Border Radius: 1rem (16px)
- Shadow: Medium
- Border: 1px solid var(--color-border)
- Hover: Transform translateY(-4px), shadow tăng
```

### Professional Tables (`.table-professional`)

#### Header
```css
- Background: Gradient #F8F9FA → #FFFFFF
- Border Bottom: 2px solid Primary
- Font Weight: 700
- Text Transform: Uppercase
- Letter Spacing: 0.05em
```

#### Rows
```css
- Hover: Gradient background, shadow, transform translateX(4px)
- Border Bottom: 1px solid bg-tertiary
```

### Badges (`.badge-status`)
```css
.badge-success: Gradient xanh lá nhạt
.badge-warning: Gradient vàng nhạt
.badge-info: Gradient xanh nhạt
.badge-error: Gradient đỏ nhạt
```

---

## ✨ Animations & Effects

### Core Animations
1. **fadeInUp**: Hiện lên từ dưới (0.6s)
2. **slideInLeft**: Trượt từ trái (0.5s)
3. **slideInRight**: Trượt từ phải (0.5s)
4. **slideDown**: Trượt xuống (0.3s)
5. **pulse-soft**: Nhấp nhẹ (2.5s vô hạn)
6. **float**: Bay lơ lửng (3s vô hạn)
7. **shimmer**: Hiệu ứng loading sáng (1.5s vô hạn)

### Hover Effects
```css
.hover-lift: Nâng lên -6px khi hover với shadow tăng
.card:hover: Nâng lên -4px với border focus
.table-row:hover: Transform translateX(4px) với background gradient
```

### Glass Effect (`.glass-effect`)
```css
- Background: rgba(255, 255, 255, 0.85)
- Backdrop Filter: blur(12px) saturate(180%)
- Border: rgba(255, 255, 255, 0.3)
- Shadow: Nhẹ với màu primary
```

---

## 🎯 Custom Scrollbar

```css
Width: 10px
Track: Tertiary background với border radius
Thumb: Gradient primary với border, hover đậm hơn
```

---

## 📦 CSS Variables

```css
--color-primary: #0052CC
--color-primary-dark: #003D99
--color-secondary: #FF8B00
--color-accent: #00B8D4
--color-success: #00C853
--color-warning: #FFB300
--color-error: #D32F2F

--color-text-primary: #172B4D
--color-text-secondary: #5E6C84
--color-text-tertiary: #8993A4

--color-bg-primary: #FFFFFF
--color-bg-secondary: #F4F5F7
--color-bg-tertiary: #EBECF0

--shadow-sm: ...
--shadow-md: ...
--shadow-lg: ...
--shadow-xl: ...

--radius-sm: 0.375rem
--radius-md: 0.5rem
--radius-lg: 0.75rem
--radius-xl: 1rem
```

---

## 🚀 Cách Sử Dụng (Usage)

### 1. Buttons
```jsx
<button className="btn-primary">
  Đăng ký
</button>

<button className="btn-secondary">
  Hủy bỏ
</button>
```

### 2. Cards
```jsx
<div className="card hover-lift">
  <h3>Card Title</h3>
  <p>Card content...</p>
</div>
```

### 3. Tables
```jsx
<table className="table-professional">
  <thead>
    <tr>
      <th>Mã SV</th>
      <th>Họ Tên</th>
    </tr>
  </thead>
  <tbody>
    <tr className="table-row-hover">
      <td>SV001</td>
      <td>Nguyễn Văn A</td>
    </tr>
  </tbody>
</table>
```

### 4. Badges
```jsx
<span className="badge-status badge-success">
  Hoàn thành
</span>

<span className="badge-status badge-warning">
  Đang xử lý
</span>
```

### 5. Animations
```jsx
<div className="animate-fadeInUp">
  Content fades in from bottom
</div>

<div className="animate-pulse-soft">
  Gentle pulsing content
</div>
```

### 6. Gradients
```jsx
<div className="bg-gradient-primary text-white">
  Primary gradient background
</div>

<div className="bg-gradient-secondary text-white">
  Secondary gradient background
</div>
```

### 7. Glass Effect
```jsx
<div className="glass-effect p-6 rounded-xl">
  Frosted glass card
</div>
```

---

## 🎨 Tailwind Classes Mới

### Colors
```
bg-primary-500, text-primary-500
bg-secondary-500, text-secondary-500
bg-accent-500, text-accent-500
bg-success-500, text-success-500
```

### Shadows
```
shadow-primary: Bóng xanh dương
shadow-primary-lg: Bóng xanh lớn
shadow-secondary: Bóng cam
shadow-accent: Bóng xanh ngọc
```

### Animations
```
animate-fadeInUp
animate-slideInLeft
animate-slideInRight
animate-slideDown
animate-pulse-soft
animate-float
animate-shimmer
```

---

## 📐 Design Principles

1. **Consistency**: Sử dụng màu sắc và khoảng cách nhất quán
2. **Readability**: Font size tối thiểu 15px cho văn bản chính
3. **Accessibility**: Contrast ratio tốt, colors semantic
4. **Professional**: Gradient tinh tế, shadow không quá đậm
5. **Smooth**: Transitions mượt mà với cubic-bezier(0.4, 0, 0.2, 1)
6. **Vietnamese-friendly**: Font Inter hỗ trợ tiếng Việt tốt

---

## 🔄 Migration Guide

### Cũ → Mới

```jsx
// Cũ
<div className="bg-blue-500">

// Mới
<div className="bg-primary-500">

// Cũ
<button className="bg-blue-600 hover:bg-blue-700">

// Mới
<button className="btn-primary">

// Cũ
<div className="shadow-lg rounded-lg">

// Mới
<div className="card">

// Cũ
<table className="...">

// Mới
<table className="table-professional">
```

---

## 📱 Responsive Design

Tất cả components đều responsive:
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Font sizes scale appropriately
- Padding/margin điều chỉnh theo màn hình

---

## 🎯 Next Steps

1. ✅ Áp dụng design system vào các trang chính
2. ✅ Update Layout component với colors mới
3. ✅ Refactor buttons và cards
4. ✅ Update tables với professional styling
5. ✅ Test responsive trên mobile/tablet

---

## 📝 Notes

- Design system này được tối ưu cho các hệ thống quản lý giáo dục
- Màu sắc professional phù hợp với môi trường đại học
- Font Inter cung cấp khả năng đọc tốt nhất cho tiếng Việt
- Animations tinh tế, không gây mất tập trung
- Shadow và gradient tạo depth chuyên nghiệp

---

**Version**: 1.0  
**Last Updated**: 2024  
**Maintained by**: Development Team
