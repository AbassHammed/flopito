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

interface FlopRoom {
  id: number
  name: string
}

export interface FlopGroup {
  id: number
  train_prog: string
  name: string
  is_structural: boolean
}

interface FlopModule {
  name: string
  abbrev: string
  display: {
    color_bg: string
    color_txt: string
  }
}

interface FlopCourse {
  id: number
  type: string
  room_type: string
  week: number
  year: number
  groups: FlopGroup[]
  supp_tutor: string[]
  module: FlopModule
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pay_module: null | any
  is_graded: boolean
}

export interface FlopEvent {
  id: number
  room: FlopRoom
  start_time: number
  day: string
  course: FlopCourse
  tutor: string
  id_visio: null | string
  number: number
}
