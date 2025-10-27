# 📁 Kế Hoạch Tổ Chức Lại Thư Mục - BookMe App

## 🎯 Mục Tiêu
Tổ chức lại cấu trúc thư mục theo best practices của React Native, Expo Router, và Clean Architecture để:
- Dễ bảo trì và mở rộng
- Tách biệt rõ ràng giữa routing và business logic
- Tổ chức components, hooks, utils theo chức năng
- Dễ tìm kiếm và quản lý code

---

## 📊 Cấu Trúc Hiện Tại (Có Vấn Đề)

```
bookme/
├── app/                    # ❌ Lộn xộn: routing + logic
│   ├── tabs/              # Tabs navigation
│   ├── auth/              # Auth screens
│   ├── booking/           # Booking flow
│   ├── hotel/             # Hotel details
│   ├── profile/           # Profile screens
│   ├── review/            # Review screens
│   ├── search.tsx         # ❌ Logic lẫn routing
│   ├── notifications.tsx
│   ├── onboarding.tsx
│   └── date-picker.tsx    # ❌ Component trong app/
├── components/            # ✅ OK nhưng thiếu tổ chức
│   ├── ChatBox.tsx
│   └── FilterModal.tsx
├── data/                  # ✅ OK
│   └── hotels.json
├── hook/                  # ⚠️ Tên sai (nên là hooks)
│   └── useFrameworkReady.ts
├── assets/                # ✅ OK
└── app-example/           # ❌ Không cần thiết
```

---

## ✨ Cấu Trúc Mới (Best Practices)

```
bookme/
├── 📱 app/                          # CHỈ ROUTING - Expo Router
│   ├── (auth)/                      # Auth group (hidden from URL)
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   ├── forgot-password.tsx
│   │   ├── reset-password.tsx
│   │   └── verification.tsx
│   │
│   ├── (tabs)/                      # Main tabs group
│   │   ├── _layout.tsx
│   │   ├── index.tsx                # Home
│   │   ├── favorites.tsx
│   │   ├── bookings.tsx
│   │   └── profile.tsx
│   │
│   ├── booking/
│   │   └── [id]/
│   │       ├── step1-dates.tsx
│   │       ├── step2-guests.tsx
│   │       ├── step3-info.tsx
│   │       ├── step4-payment.tsx
│   │       ├── step5-additional.tsx
│   │       └── confirm.tsx
│   │
│   ├── hotel/
│   │   └── [id].tsx
│   │
│   ├── review/
│   │   └── [id].tsx
│   │
│   ├── search.tsx
│   ├── notifications.tsx
│   ├── onboarding.tsx
│   ├── _layout.tsx
│   └── +not-found.tsx
│
├── 🧩 src/                          # Source code chính
│   ├── components/                  # Reusable components
│   │   ├── ui/                      # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Badge.tsx
│   │   │
│   │   ├── layout/                  # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Container.tsx
│   │   │   └── SafeAreaView.tsx
│   │   │
│   │   ├── shared/                  # Shared business components
│   │   │   ├── HotelCard.tsx
│   │   │   ├── BookingCard.tsx
│   │   │   ├── ReviewCard.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── GuestSelector.tsx
│   │   │   └── LocationSearch.tsx
│   │   │
│   │   ├── features/                # Feature-specific components
│   │   │   ├── chat/
│   │   │   │   ├── ChatBox.tsx
│   │   │   │   ├── ChatMessage.tsx
│   │   │   │   └── ChatInput.tsx
│   │   │   │
│   │   │   ├── filters/
│   │   │   │   ├── FilterModal.tsx
│   │   │   │   ├── PriceRange.tsx
│   │   │   │   └── SortOptions.tsx
│   │   │   │
│   │   │   └── search/
│   │   │       ├── SearchBar.tsx
│   │   │       └── SearchResults.tsx
│   │   │
│   │   └── index.ts                 # Export barrel
│   │
│   ├── hooks/                       # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useBooking.ts
│   │   ├── useFavorites.ts
│   │   ├── useHotels.ts
│   │   ├── useFrameworkReady.ts
│   │   └── index.ts
│   │
│   ├── services/                    # API & External services
│   │   ├── api/
│   │   │   ├── hotels.ts
│   │   │   ├── bookings.ts
│   │   │   ├── auth.ts
│   │   │   └── reviews.ts
│   │   │
│   │   ├── gemini/
│   │   │   └── chatbot.ts
│   │   │
│   │   └── storage/
│   │       └── asyncStorage.ts
│   │
│   ├── utils/                       # Utility functions
│   │   ├── formatters.ts            # Date, currency formatters
│   │   ├── validators.ts            # Form validators
│   │   ├── helpers.ts               # General helpers
│   │   └── constants.ts             # App constants
│   │
│   ├── types/                       # TypeScript types
│   │   ├── hotel.ts
│   │   ├── booking.ts
│   │   ├── user.ts
│   │   ├── review.ts
│   │   └── index.ts
│   │
│   ├── config/                      # Configuration
│   │   ├── api.config.ts
│   │   ├── theme.config.ts
│   │   └── navigation.config.ts
│   │
│   ├── contexts/                    # React Context
│   │   ├── AuthContext.tsx
│   │   ├── BookingContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── styles/                      # Shared styles
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── theme.ts
│   │
│   └── data/                        # Static/Mock data
│       ├── hotels.json
│       ├── cities.json
│       └── amenities.json
│
├── 🎨 assets/                       # Static assets
│   ├── images/
│   │   ├── logo.png
│   │   ├── onboarding/
│   │   └── hotels/
│   │
│   ├── icons/
│   └── fonts/
│
├── 📝 docs/                         # Documentation
│   ├── API.md
│   ├── COMPONENTS.md
│   └── SETUP.md
│
├── 🧪 __tests__/                    # Tests (future)
│   ├── components/
│   ├── hooks/
│   └── utils/
│
├── .expo/
├── .git/
├── .vscode/
├── node_modules/
├── .gitignore
├── app.json
├── package.json
├── tsconfig.json
├── eslint.config.js
├── expo-env.d.ts
└── README.md
```

---

## 🔄 Migration Steps (Các Bước Di Chuyển)

### Phase 1: Tạo cấu trúc src/ mới
```bash
# Tạo thư mục src và các sub-folders
mkdir src
mkdir src/components src/components/ui src/components/layout src/components/shared src/components/features
mkdir src/hooks src/services src/utils src/types src/config src/contexts src/styles src/data
mkdir src/components/features/chat src/components/features/filters src/components/features/search
mkdir src/services/api src/services/gemini src/services/storage
```

### Phase 2: Di chuyển Components
```bash
# Di chuyển components hiện tại
mv components/ChatBox.tsx src/components/features/chat/
mv components/FilterModal.tsx src/components/features/filters/

# Tạo components mới từ logic trong app/
# - DatePicker từ app/date-picker.tsx
# - GuestSelector từ app/guest-selector.jsx
# - LocationSearch từ app/location-search.tsx
```

### Phase 3: Di chuyển Hooks & Data
```bash
mv hook/useFrameworkReady.ts src/hooks/
mv data/hotels.json src/data/
```

### Phase 4: Tổ chức lại app/ routing
```bash
# Rename auth/ thành (auth)/
# Rename tabs/ thành (tabs)/
# Di chuyển logic từ screens sang src/components/
```

### Phase 5: Xóa thư mục không cần thiết
```bash
rm -rf app-example/
rmdir hook/
rmdir components/
rmdir data/
```

---

## 📋 Import Path Updates

### Trước:
```typescript
import ChatBox from '@/components/ChatBox';
import { useFrameworkReady } from '@/hook/useFrameworkReady';
import hotels from '@/data/hotels.json';
```

### Sau:
```typescript
import { ChatBox } from '@/src/components/features/chat';
import { useFrameworkReady } from '@/src/hooks';
import { hotels } from '@/src/data';
import { Button, Input } from '@/src/components/ui';
import { HotelCard } from '@/src/components/shared';
```

---

## ✅ Lợi Ích

### 1. **Tổ chức Rõ Ràng**
- `app/` - CHỈ routing (Expo Router)
- `src/` - TOÀN BỘ business logic
- Tách biệt concerns

### 2. **Dễ Mở Rộng**
- Thêm feature mới: tạo folder trong `src/components/features/`
- Thêm API: tạo file trong `src/services/api/`
- Thêm hook: tạo file trong `src/hooks/`

### 3. **Reusability**
- UI components trong `src/components/ui/` dùng chung
- Shared components cho business logic chung
- Feature components độc lập

### 4. **Type Safety**
- Tập trung types trong `src/types/`
- Import dễ dàng, autocomplete tốt

### 5. **Testing**
- Dễ test components và hooks riêng biệt
- Mock services dễ dàng

### 6. **Team Collaboration**
- Mỗi dev làm 1 feature folder
- Ít conflict khi merge
- Code review dễ hơn

---

## 🚀 Next Steps

1. **Backup toàn bộ project** trước khi restructure
2. Tạo branch mới: `git checkout -b restructure/folder-organization`
3. Thực hiện từng phase một
4. Update import paths
5. Test kỹ toàn bộ app
6. Commit và merge

---

## 📌 Notes

- **Không cần phải di chuyển tất cả ngay** - có thể làm dần
- **Giữ nguyên app/ routing** - chỉ di chuyển logic ra ngoài
- **Tạo barrel exports** (index.ts) để import dễ hơn
- **Update tsconfig.json** nếu cần alias mới

---

## 🎯 Priority

### High Priority (Làm ngay):
1. ✅ Tạo src/components/
2. ✅ Di chuyển ChatBox, FilterModal
3. ✅ Tạo src/hooks/ và di chuyển hooks
4. ✅ Tạo src/data/ và di chuyển data

### Medium Priority (Làm sau):
5. ⏳ Tách UI components
6. ⏳ Tạo services layer
7. ⏳ Tổ chức types

### Low Priority (Optional):
8. 📝 Testing setup
9. 📝 Documentation
10. 📝 Storybook cho components

---

**Created:** October 27, 2025
**Version:** 1.0
**Author:** AI Assistant
