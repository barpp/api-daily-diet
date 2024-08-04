import fastify from 'fastify'
import { env } from './env'
import { transactionsMealsRoutes } from './routes/meals'
import cookie from '@fastify/cookie'

const app = fastify()

app.register(cookie)
app.register(transactionsMealsRoutes, {
  prefix: 'meals',
})

app
  .listen({
    host: '0.0.0.0',
    port: env.PORT,
  })
  .then(() => {
    console.log('HTTP Server Running')
  })
