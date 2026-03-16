import { http } from './http'

export async function exportExcel(path: string) {
  const resp = await http.get<ArrayBuffer>(path, { responseType: 'arraybuffer' })
  return resp.data
}

export async function importExcel(path: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  const resp = await http.post<{ upserted: number }>(path, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return resp.data
}

export async function exportJson<T>(path: string) {
  const resp = await http.get<T>(path)
  return resp.data
}

export async function importJson<TResp, TRow = unknown>(path: string, rows: TRow[]) {
  const resp = await http.post<TResp>(path, rows, { headers: { 'Content-Type': 'application/json' } })
  return resp.data
}

