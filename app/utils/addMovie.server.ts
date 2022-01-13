import { job } from '@prisma/client'

const validDepartments = ['Writing', 'Sound', 'Production', 'Directing']
const jobs: Record<string, job> = {
  Screenplay: 'writer',
  Writer: 'writer',
  'Original Music Composer': 'composer',
  Producer: 'producer',
  'Associate Producer': 'producer',
  'Executive Producer': 'producer',
  Director: 'director',
}

export const getCastAndCrew = (
  cast: Array<{ name: string; id: number }>,
  crew: Array<{ name: string; id: number; job: job; department: string }>
) => {
  const persons = new Map()

  for (const credit of cast) {
    persons.set(credit.id + '-cast', {
      job: 'cast' as job,
      person: {
        connectOrCreate: {
          create: { name: credit.name, original_id: credit.id },
          where: { original_id: credit.id },
        },
      },
    })
  }

  for (const credit of crew) {
    if (
      Object.keys(jobs).includes(credit.job) &&
      validDepartments.includes(credit.department)
    ) {
      persons.set(credit.id + '-' + jobs[credit.job], {
        job: jobs[credit.job],
        person: {
          connectOrCreate: {
            create: { name: credit.name, original_id: credit.id },
            where: { original_id: credit.id },
          },
        },
      })
    }
  }

  return Array.from(persons.values())
}

export const imdbId = (input: FormDataEntryValue | null) =>
  input?.toString().match(/tt\d+/)?.[0]
