import 'dotenv/config'
import './config/database.ts'
import app from './app.ts'

const port = process.env.PORT || 5000
app.listen(port, () => {
  console.log(`Server running at ${port} port`)
})
