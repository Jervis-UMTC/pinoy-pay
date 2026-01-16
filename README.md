# PinoyPay 🇵🇭

**PinoyPay** is an offline-first **Salary Calculator & Work Log** designed specifically for Filipino workers. It helps you track your daily earnings, overtime, night differential, and holiday pay with adherence to standard Philippine labor definitions.

![PinoyPay App](/public/icons/pinoypay.svg)

## 🚀 Features

*   **Offline First (PWA)**: Works without an internet connection. Installable on Android/iOS.
*   **Smart Calculations**: Automatically computes:
    *   Regular Overtime (125%)
    *   Rest Day Overtime (130% / 169%)
    *   Special Non-Working Holidays (130%)
    *   Regular Holidays (200% / 260%)
    *   Night Differential (+10%)
*   **Calendar Visualization**:
    *   Visual indicators for Pay Days (15th/30th, Weekly, or Monthly).
    *   Gold badges for "Paid" days, Green badges for "Pending".
    *   Monthly earning projections vs. actual earnings.
*   **Flexible Settings**:
    *   Support for **Daily** or **Hourly** rate basis.
    *   Customizable work schedule (Mon-Fri, Mon-Sat, etc.).
    *   Adjustable shift start/end times.
*   **Privacy Focused**: All data is stored locally on your device (`localStorage`). No servers, no tracking.

## 🛠️ Tech Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Date Handling**: [date-fns](https://date-fns.org/)
*   **PWA**: `next-pwa`

## 📱 Installation

### As a User (PWA)
1.  Open the app in Chrome (Android) or Safari (iOS).
2.  Tap the **"Install App"** button in the navigation menu (or "Add to Home Screen" in browser settings).
3.  Launch from your home screen like a native app.

### For Developers

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/pinoy-pay.git
    cd pinoy-pay
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## 📦 Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).

---

> **Note**: This tool is for estimation purposes only. Always verify with your official payslip.
