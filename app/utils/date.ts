const dateFormatter = new Intl.DateTimeFormat('sv-SE')

export const formatDate = (date: Date) => dateFormatter.format(new Date(date))
