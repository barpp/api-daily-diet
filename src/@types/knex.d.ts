// eslint-disable-next-line
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      name: string
      description: string
      inside: enum
      created_at: string
      updated_at: string
      session_id?: string
    }
  }
}
