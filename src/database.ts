import { knex as setupKnex, Knex } from 'knex'
import 'dotenv/config'
import { env } from './env'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found')
}

export const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    host: '0.0.0.0',
    filename: env.DATABASE_URL,
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const knex = setupKnex(config)
