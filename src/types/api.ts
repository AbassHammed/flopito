export interface Department {
  id: number
  abbrev: string
}

export interface Teacher {
  username: string
  first_name: string
  last_name: string
  email: string
  departments: Department[]
}

export type TeachersResponse = Teacher[]
