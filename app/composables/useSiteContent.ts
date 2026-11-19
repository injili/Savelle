import { site } from '~~/data/site'

/** Last path segment of a content page path ('/work/foo' → 'foo'). */
export const slugOf = (path: string) => path.split('/').filter(Boolean).pop() ?? ''

/** Visible case studies: published, or all of them when drafts are allowed. */
export function useWorkList() {
  const drafts = useShowDrafts()
  return useAsyncData('work-list', async () => {
    const all = await queryCollection('work').order('order', 'ASC').all()
    return all.filter(w => w.published || drafts)
  })
}

/** All insights (including forthcoming); `linkable` says whether a detail page exists. */
export function useInsightsList() {
  const drafts = useShowDrafts()
  return useAsyncData('insights-list', async () => {
    const all = await queryCollection('insights').order('order', 'ASC').all()
    return all.map(i => ({ ...i, slug: slugOf(i.path), linkable: i.published || drafts }))
  })
}

export function useServicesList() {
  return useAsyncData('services-list', () => queryCollection('services').order('order', 'ASC').all())
}

export const categoryTitle = (id: string) => site.insights.categories.find(c => c.id === id)?.title ?? id
