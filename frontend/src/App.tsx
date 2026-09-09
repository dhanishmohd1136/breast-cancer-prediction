import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Landing from './pages/Landing'
import Predict from './pages/Predict'

function NotFound() {
  return (
    <div className="shell notfound">
      <h1>404</h1>
      <p>That page is not part of this composition.</p>
      <Link className="btn btn--blue" to="/">
        Back to overview
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/predict" element={<Predict />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
