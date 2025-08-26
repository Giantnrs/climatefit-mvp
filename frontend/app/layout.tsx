
import type { Metadata } from 'next'
import './globals.css'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

export const metadata: Metadata = { title:'ClimateFit', description:'Personalised climate matching' }

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Nav/>
        <main className="container py-6">{children}</main>
        <Footer/>
      </body>
    </html>
  )
}
