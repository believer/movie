const formatter = (options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('sv-SE', options)

export const formatDate = (date: Date) => formatter().format(new Date(date))
export const yearFromDate = (date: Date) =>
  formatter({ year: 'numeric' }).format(new Date(date))
