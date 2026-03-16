# AMALI KREDIT - POS & Simulator Kredit Modern

AMALI KREDIT adalah sistem Point of Sale (POS) modern yang dirancang khusus untuk toko elektronik dan furnitur dengan fitur utama simulasi kredit yang akurat dan pengelolaan transaksi pelanggan.

## 🚀 Fitur Utama

- **Dashboard Kasir (POS)**: Antarmuka belanja yang bersih dengan pencarian produk dan filter kategori yang responsif.
- **Simulator Kredit Terintegrasi**: 
  - Kalkulasi cicilan real-time menggunakan faktor pengali (F-Factor).
  - Mendukung tenor 3, 6, 9, dan 12 bulan.
  - Fitur **Pelunasan Dipercepat** dengan kalkulasi sisa kewajiban yang akurat.
- **Aturan Bisnis Kredit**:
  - **Uang Muka (DP) Minimal 20%**: Validasi otomatis dan fitur auto-fill saat menginput harga.
  - **Biaya Admin Rp 200.000**: Penambahan biaya administrasi otomatis untuk setiap transaksi kredit.
- **Manajemen Pelanggan**: Integrasi data pelanggan dengan riwayat transaksi lengkap.
- **Pelacakan Cicilan (Installment Tracking)**:
  - Visualisasi progres pembayaran dengan progres bar dan bulir-bulir bulanan.
  - Pencatatan pembayaran cicilan yang mudah melalui riwayat transaksi.
- **Struk Digital**: Rincian transaksi transparan untuk metode Cash maupun Kredit.
- **UI Premium**: Desain modern menggunakan Tailwind CSS dengan dukungan animasi halus dan ikon Lucide.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Tailwind CSS.
- **Backend**: Node.js, Express.
- **Database**: SQLite.
- **ORM**: Prisma.
- **Icons**: Lucide React.
- **State/Logic**: React Hooks (useState, useMemo).

## 📂 Struktur Folder

```text
AMALI-KREDIT/
├── server/            # Backend API (Express & Prisma)
├── prisma/            # Schema Database & Seed Data
├── src/               # Frontend Logic
│   ├── components/    # Reusable UI Components
│   ├── pages/         # Dashboard, Simulator, Customers, etc.
│   ├── utils/         # Kalkulator Kredit, Formatter, etc.
│   └── assets/        # Global CSS & Images
└── scripts/           # Helper scripts untuk pengujian
```

## ⚙️ Cara Instalasi

1. **Clone repository**:
   ```bash
   git clone [repository-url]
   cd AMALI-KREDIT
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Setup Database (Prisma)**:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```

4. **Jalankan Aplikasi (Development Mode)**:
   ```bash
   npm run dev
   ```
   *Perintah ini akan menjalankan client (Vite) dan server (Express) secara bersamaan menggunakan `concurrently`.*

## 📊 Aturan Kalkulasi Kredit

Aplikasi ini menggunakan skema faktor pengali tetap:
- **3 Bulan**: 0.368
- **6 Bulan**: 0.208
- **9 Bulan**: 0.1475
- **12 Bulan**: 0.121

**Rumus Utama**:
- `Pokok = (Harga Barang - DP)`
- `Cicilan per Bulan = Pokok * Faktor`
- `Total Kewajiban = Cicilan * Tenor`
- `Grand Total = Total Kewajiban + DP + Biaya Admin (200.000)`

---

*Dikembangkan untuk memberikan pengalaman kredit yang transparan dan efisien.*
