import Header from './Header'
import Footer from './Footer'
import AIChatBot from '../AI/AIChatBot'

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
      <AIChatBot />
    </div>
  )
}

export default Layout

