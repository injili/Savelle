import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Single source of truth for "may drafts be shown?" at BUILD time.
 * - NUXT_PUBLIC_SHOW_DRAFTS=true|false overrides everything
 * - otherwise: true in `nuxt dev` and on Vercel preview deployments, false in production
 */
export function showDraftsAtBuild(): boolean {
  const flag = process.env.NUXT_PUBLIC_SHOW_DRAFTS
  if (flag) return flag === 'true'
  return process.env.VERCEL_ENV === 'preview' || process.env.NODE_ENV !== 'production'
}

/**
 * Files in content/<dir> whose frontmatter does not say `published: true`.
 * Used to exclude unpublished case studies from production builds entirely,
 * so their text never reaches the client-side content database.
 */
export function unpublishedFiles(dir: string): string[] {
  const abs = join(process.cwd(), 'content', dir)
  let files: string[] = []
  try {
    files = readdirSync(abs).filter(f => f.endsWith('.md'))
  }
  catch {
    return []
  }
  return files
    .filter((f) => {
      const src = readFileSync(join(abs, f), 'utf8')
      const fm = src.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
      return !/^published:\s*true\s*$/m.test(fm)
    })
    .map(f => `${dir}/${f}`)
}
