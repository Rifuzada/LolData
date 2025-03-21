import { Inter as FontSans } from "next/font/google"
import { ThemeProvider } from "@/app/components/theme-provider"
import './globals.css'

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata = {  
  icons: {
    icon: '/favicon.ico', // /public path
  },
  title: 'LolData',
  description: 'Visualize suas estatísticas do League of Legends',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${fontSans.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
