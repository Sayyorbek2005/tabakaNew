# Ta’minot CRM — Create React App

Minimal, yashil va oq ranglardagi ta’minotchilar hisobi. Barcha sahifalar va komponentlar alohida JSX, har bir sahifa uchun alohida CSS faylga ajratilgan. Supabase hozircha ulanmagan.

## Ishga tushirish (Windows PowerShell / terminal)

ZIP faylni oching va `taminot-crm` papkasini VS Code’da oching. Terminalda:

```bash
npm install
npm start
```

Brauzer: http://localhost:3000

Loyiha allaqachon CRA asosida tayyor: `npx create-react-app` ni qayta ishlatishingiz shart emas.

Production build:

```bash
npm run build
```

Hisob-kitob testlari:

```bash
npm test -- --runInBand
```

Node.js 22 LTS ishlatish tavsiya etiladi. React 18.3.1 va react-scripts 5.0.1 belgilangan. Create React App yangi loyihalar uchun React jamoasi tomonidan deprecated qilingan; foydalanuvchi so‘roviga muvofiq shu stack ishlatildi. Rasmiy ma’lumot: https://react.dev/blog/2025/02/14/sunsetting-create-react-app

## Ishlash tartibi

1. **Ta’minotchilar**: nom, telefon va ixtiyoriy izoh kiriting.
2. **Kategoriyalar**: o‘zingiz kategoriyalar yarating.
3. **Mahsulotlar**: nom, ta’minotchi, kategoriya, miqdor, birlik (kg/litr/dona), 1 birlik narxi va sana kiriting.
4. Har bir kirimga avtomatik, qayta ishlatilmaydigan `MHS-0001` kabi ID beriladi. Texnik ID — UUID.
5. **To‘lovlar**: ta’minotchini, kirim yoki barcha qarzlarni, summani, naqd/karta usulini va sanani tanlang.
6. Umumiy to‘lov sanasi eng eski bo‘lgan qarzli kirimlardan boshlab avtomatik taqsimlanadi. Bir sanada ID tartibi qo‘llanadi.
7. **Umumiy ko‘rinish**: barcha kirim summasi, to‘langan pul, qarz, ta’minotchilar soni, kirimlar soni va to‘lov turlari jami.
8. **Nusxa olish**: barcha yozuvlarni JSON zaxira nusxa sifatida yuklab oling. Hozircha ilova ichida JSON import qilish yo‘q.

## Hisoblash

- Mahsulot kirimi summasi = miqdor × 1 birlik narxi.
- Kirim qarzi = kirim summasi − shu kirimga taqsimlangan to‘lovlar.
- Ta’minotchi jami = shu ta’minotchining barcha kirimlari jami.
- Ta’minotchi qarzi = ta’minotchi jami − unga qilingan to‘lovlar.
- Umumiy qarz = barcha kirim summalari − barcha to‘lovlar.
- To‘lov va narx: 2 kasr xona, kg/litr: 3 kasr xona, dona: butun son. Summa 2 kasrga yaxlitlanadi.
- Turli birliklar (kg/litr/dona) bitta umumiy miqdorga qo‘shilmaydi. Mahsulot soni — kirim yozuvlari soni; bir mahsulot yana kelsa, yangi kirim yaratiladi va yangi ID beriladi.

Misol: 50 kg un × 8 000 so‘m = 400 000 so‘m. 150 000 so‘m naqd to‘lovdan keyin qarz 250 000 so‘m. Qolganini karta bilan to‘lash mumkin.

## Tahrirlash va o‘chirish

- Ta’minotchi, kategoriya va kirim tahrirlanadi.
- Har qanday o‘chirishdan oldin tasdiq so‘raladi.
- Mahsuloti bor kategoriya o‘chirilmaydi: avval mahsulotni boshqa kategoriyaga o‘tkazing.
- Kirimi/to‘lovi bor ta’minotchi o‘chirilmaydi.
- To‘lovi bor mahsulot kirimi o‘chirilmaydi; uning ta’minotchisini ham almashtirib bo‘lmaydi.
- Kirim summasi avval to‘langan summadan kichik qilib o‘zgartirilmaydi.
- To‘lov qarzdan oshmasligi kerak. Avans bu bosqichda ko‘zda tutilmagan.
- To‘lovni bekor qilish qarzni qayta hisoblaydi. Xato to‘lovni bekor qilib, to‘g‘risini qayta kiriting.
- Bu to‘lov qayd qilish tizimi: bankdan pul o‘tkazmaydi va kartadan pul yechmaydi.

## Ma’lumot saqlash va keyingi bosqich

Hozir barcha yozuvlar ayni brauzerning `localStorage` xotirasida saqlanadi (`taminot-crm-v1`). Brauzer xotirasini tozalash ma’lumotni yo‘qotadi. Qurilmalar va brauzerlar o‘rtasida sinxronlash yo‘q; bir paytda bir nechta tabda tahrirlash tavsiya etilmaydi. Hozircha login/rollar yo‘q. Ma’lumotlar dastlab bo‘sh.

Supabase uchun keyin `suppliers`, `categories`, `products`, `payments`, `payment_allocations` jadvallari kerak bo‘ladi. `services/localRepository.js` — hozirgi saqlash qatlami, `context/StoreContext.jsx` — amallar va tekshiruvlar, `utils/accounting.js` — hisob-kitob. Keyingi bosqichda autentifikatsiya, RLS, tranzaksiyali to‘lov taqsimlash va serverda qarz tekshiruvi qo‘shiladi. Supabase kalitlarini hozir kiritish kerak emas.

## Papkalar

```text
taminot-crm/
  public/index.html
  src/
    index.jsx
    index.css
    App.jsx
    App.css
    components/
      Layout.jsx / Layout.css
      Icon.jsx
      Modal.jsx / Modal.css
      RecordForm.jsx
      StatCard.jsx / StatCard.css
      EmptyState.jsx / EmptyState.css
      ProductTable.jsx / ProductTable.css
    context/StoreContext.jsx
    services/localRepository.js
    utils/accounting.js
    utils/accounting.test.js
    pages/
      Dashboard.jsx / Dashboard.css
      Suppliers.jsx / Suppliers.css
      Categories.jsx / Categories.css
      Products.jsx / Products.css
      Payments.jsx / Payments.css
  package.json
  package-lock.json
  README.md
  KODLAR.md
```

RecordForm Modal.css’dagi umumiy forma stillaridan foydalanadi. Icon.jsx SVG komponenti bo‘lib, alohida CSS talab qilmaydi. KODLAR.md ichida barcha manba fayllari nusxa olish uchun yo‘l nomlari bilan tartiblangan.
