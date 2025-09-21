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

export interface GroupInfo {
  id: number
  train_prog: string // Promo: BUT1, BUT2, BUT3, LP, etc.
  name: string // Group name: A, B, C, G1, G2, DV1, BD, RE, etc.
  is_structural: boolean
}

export interface PromoGroups {
  promo: string
  groups: Array<{
    id: number
    name: string
    fullName: string // Combined promo + group name
  }>
}
