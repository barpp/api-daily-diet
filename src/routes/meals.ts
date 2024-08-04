import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { error } from 'console'

// Cookies - São formas de mantermos contexto entre as requisições.

export async function transactionsMealsRoutes(app: FastifyInstance) {
  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const getTransactionsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTransactionsParamsSchema.parse(request.params)
      const meal = await knex('meals').where('id', id).first()

      if (!meal) {
        return reply.status(404).send({ error: 'Meal not found' })
      }

      await knex('meals').where({ session_id: sessionId, id }).delete()

      return reply.status(200).send()
    },
  )

  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const paramsSchema = z.object({ id: z.string().uuid() })
      const { id } = paramsSchema.parse(request.params)

      const updateMealSchema = z.object({
        name: z.string(),
        description: z.string(),
        inside: z.enum(['yes', 'no']),
      })

      const { name, description, inside } = updateMealSchema.parse(request.body)
      console.log(id, name, description, inside)

      const meal = await knex('meals').where({
        session_id: sessionId,
        id,
      })

      if (!meal) {
        return reply.status(400).send({ error: 'Meal not found' })
      }

      await knex('meals').where('id', id).update({
        name,
        description,
        inside,
        session_id: sessionId,
        updated_at: knex.fn.now(),
      })
      return reply.status(200).send('Updated Sucessful!')
    },
  )

  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const { sessionId } = request.cookies
      const transactions = (
        await knex('meals').where('session_id', sessionId).select()
      ).length

      const totalInside = (
        await knex('meals').where({ session_id: sessionId, inside: 'yes' })
      ).length

      const totalOutside = (
        await knex('meals').where({ session_id: sessionId, inside: 'no' })
      ).length

      const totalMeals = await knex('meals')
        .where('session_id', sessionId)
        .select('inside')

      const { bestSequence } = totalMeals.reduce(
        (acum, meal) => {
          if (meal.inside === 'yes') {
            acum.currentSequence += 1
          } else {
            acum.currentSequence = 0
          }

          if (acum.currentSequence > acum.bestSequence) {
            acum.bestSequence = acum.currentSequence
          }

          return acum
        },
        { bestSequence: 0, currentSequence: 0 },
      )

      return {
        // total,
        TotalMeals: transactions,
        TotalMealsIside: totalInside,
        TotalMealsOutside: totalOutside,
        BestSequenceOnDiet: bestSequence,
      }
    },
  )

  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const transactions = await knex('meals')
        .where('session_id', sessionId)
        .select()

      return {
        transactions,
      }
    },
  )

  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
    },
    async (request) => {
      const getTransactionsParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { sessionId } = request.cookies
      const { id } = getTransactionsParamsSchema.parse(request.params)
      const transactions = await knex('meals').where({
        session_id: sessionId,
        id,
      })
      return { transactions }
    },
  )

  app.post('/', async (request, reply) => {
    const createTranscationBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      inside: z.enum(['yes', 'no']),
    })

    const { name, description, inside } = createTranscationBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()
      reply.cookie('sessionId', sessionId, {
        path: '/meals',
        maxAge: 60 * 60 * 24 * 30 * 3, // Cookie expira em 90 dias
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      inside,
      session_id: sessionId,
    })

    return reply.status(201).send()
  })
}
