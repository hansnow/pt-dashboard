import { createHmac } from 'crypto'

export const secret = '!)5&!h-x6w!o#32jkmwj1wue*4etx&h*+2$izq7t1e65932@5m'

export function sha256(s: string) {
  return createHmac('sha256', secret)
    .update(s)
    .digest('hex')
}
