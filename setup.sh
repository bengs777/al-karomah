#!/bin/bash

# ============================================
# WEBSITE MASJID AL KAROMAH - SETUP SCRIPT
# ============================================

echo "╔════════════════════════════════════════╗"
echo "║  Website Masjid Al Karomah - Setup     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js tidak terinstall"
    echo "Silakan install Node.js dari https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js terdeteksi: $(node --version)"
echo "✓ NPM terdeteksi: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Menginstall dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Gagal menginstall dependencies"
    exit 1
fi

echo "✓ Dependencies berhasil diinstall"
echo ""

# Setup environment
echo "⚙️  Mengatur environment..."

if [ ! -f .env ]; then
    echo "📄 Membuat file .env..."
    cp .env.example .env
    echo "✓ File .env berhasil dibuat"
else
    echo "ℹ️  File .env sudah ada"
fi

echo ""
echo "✅ Setup selesai!"
echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Perintah Berikutnya                   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "1. Setup Database:"
echo "   npm run db:init"
echo ""
echo "2. Mulai Development Server:"
echo "   npm run dev"
echo ""
echo "3. Atau gunakan npm start untuk production"
echo ""
echo "Default Admin:"
echo "  Email: admin@alkaromah.com"
echo "  Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Ubah password admin di production!"
echo ""
