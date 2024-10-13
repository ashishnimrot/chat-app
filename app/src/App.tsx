import { useEffect, useState } from 'react'
import axios from 'axios'

const App: React.FC = () => {
  const [message, setMessage] = useState('')

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

    if (!apiBaseUrl) {
      console.error('VITE_API_BASE_URL is not defined')
      return
    }

    axios
      .get(`${apiBaseUrl}/test`)
      .then((response) => {
        setMessage(response.data.message)
      })
      .catch((error) => {
        console.error('Error fetching API:', error)
      })
  }, [])

  return (
    <div>
      <h1>Environment: {import.meta.env.MODE}</h1>
      <p>Message from API: {message}</p>
    </div>
  )
}

export default App
