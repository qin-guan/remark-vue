import { Fragment, defineComponent, h, ref, toRef, watch } from 'vue'
import type { Ref, VNode } from 'vue'

import type { PluggableList } from 'unified'
import { unified } from 'unified'

import remarkParse, { type Options as RemarkParseOptions } from 'remark-parse'
import remarkGfm, { type Options as RemarkGfmOptions } from 'remark-gfm'
import remarkToRehype from 'remark-rehype'

import type { Options as RemarkRehypeOptions } from 'mdast-util-to-hast'
import { type Options as RehypeVueOptions, rehypeVue } from 'rehype-vue'
import { createIsomorphicDestructurable } from './utils'

export interface ParseSyncOptions {
  remarkParseOptions?: RemarkParseOptions
  remarkGfmOptions?: RemarkGfmOptions
  remarkToRehypeOptions?: RemarkRehypeOptions
  rehypeVueOptions?: RehypeVueOptions
  remarkPlugins?: PluggableList
  rehypePlugins?: PluggableList
}

export function parseSync(source: string,
  {
    remarkParseOptions,
    remarkGfmOptions,
    remarkToRehypeOptions,
    rehypeVueOptions,
    remarkPlugins = [],
    rehypePlugins = [],
  }: ParseSyncOptions = {}) {
  return unified()
    .use(remarkParse, remarkParseOptions)
    .use(remarkGfm, remarkGfmOptions)
    .use(remarkPlugins)
    .use(remarkToRehype, remarkToRehypeOptions)
    .use(rehypePlugins)
    .use(rehypeVue, rehypeVueOptions)
    .processSync(source).result as VNode
}

export interface UseRemarkOptions extends ParseSyncOptions {
}

export function useRemark(source: Ref<string>, {
  remarkParseOptions,
  remarkGfmOptions,
  remarkToRehypeOptions,
  rehypeVueOptions,
  remarkPlugins = [],
  rehypePlugins = [],
}: UseRemarkOptions = {}) {
  const parser = unified()
    .use(remarkParse, remarkParseOptions)
    .use(remarkGfm, remarkGfmOptions)
    .use(remarkPlugins)
    .use(remarkToRehype, remarkToRehypeOptions)
    .use(rehypePlugins)
    .use(rehypeVue, rehypeVueOptions)

  const error = ref<Error | null>(null)
  const content = ref<VNode>(h(Fragment))

  watch(source, async () => {
    if (error.value)
      error.value = null

    try {
      content.value = (await parser.process(source.value)).result as VNode
    }
    catch (err) {
      error.value = err as Error
    }
  })

  return createIsomorphicDestructurable({
    content, error,
  }, [
    content, error,
  ])
}

export interface RemarkProps extends UseRemarkOptions {
  source: Ref<string>
}

export const Remark = defineComponent<RemarkProps>({
  setup(props, { slots }) {
    const { content, error } = useRemark(toRef(props, 'source'), props)

    return () => {
      if (error.value) {
        return h(Fragment,
          // @ts-expect-error Not sure how to declare slots
          slots.error({ error }),
        )
      }

      return h('div', content)
    }
  },
})
