export const API_URL = (() => {
  return process.env.NEXT_PUBLIC_API_URL!
})()

export const AMPHIS_MAP = new Map<string, string>([
  ['GMP', 'Lambert'],
  ['NA', 'Nouvel amphi'],
  ['GB', 'Génie Biologique'],
  ['BC', 'Bloc central'],
])
