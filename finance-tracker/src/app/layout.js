import "./globals.css";

export const metadata = {
  title: "Finance Tracker - Manage Your Money",
  description: "Track expenses, visualize spending patterns, and take control of your finances with our intuitive personal finance tracker.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light">
      <body className="antialiased bg-white">
        {children}
      </body>
    </html>
  );
}
