export class ResponseError extends Error {
  code?: number

  constructor(message: string | undefined, code?: number) {
    super(
      message ||
        'API error happened while trying to communicate with the server.'
    )
    this.code = code
    this.name = 'ResponseError'
  }
}

export interface GroupHierarchy {
  id: number
  name: string
  fullName: string
  level: 'promo' | 'specialization' | 'group' | 'subgroup'
  parent?: string
  children?: GroupHierarchy[]
}

export interface PromoGroups {
  promo: string
  hierarchy: GroupHierarchy
}
