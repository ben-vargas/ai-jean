import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@/test/test-utils'
import { Bug, GitPullRequest } from '@/components/icons/reicon'
import { ContextMentionPopover } from './ContextMentionPopover'
import type { ContextMentionItem } from './hooks/useContextMentionData'
import type * as EnvironmentModule from '@/lib/environment'

const useContextMentionDataMock = vi.hoisted(() => vi.fn())
const platform = vi.hoisted(() => ({ native: false, mobile: false }))

vi.mock('@/lib/environment', async importOriginal => ({
  ...(await importOriginal<typeof EnvironmentModule>()),
  isNativeApp: () => platform.native,
}))

vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: () => platform.mobile,
}))

const items: ContextMentionItem[] = [
  {
    id: 'issue:123',
    type: 'issue',
    label: '#123',
    title: 'Fix login bug',
    subtitle: 'open issue by alice',
    badge: 'open',
    icon: Bug,
  },
  {
    id: 'pr:45',
    type: 'pr',
    label: 'PR #45',
    title: 'Add context mentions',
    subtitle: 'open main ← feature',
    badge: 'open',
    icon: GitPullRequest,
  },
]

vi.mock('./hooks/useContextMentionData', () => ({
  useContextMentionData: useContextMentionDataMock,
}))

describe('ContextMentionPopover', () => {
  beforeEach(() => {
    platform.native = false
    platform.mobile = false
    useContextMentionDataMock.mockImplementation(() => ({
      groups: [
        { id: 'issue', heading: 'GitHub Issues', items: [items[0]] },
        { id: 'pr', heading: 'GitHub Pull Requests', items: [items[1]] },
      ],
      isFetching: false,
    }))
  })

  beforeAll(() => {
    class ResizeObserverMock {
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock)
    Element.prototype.scrollIntoView = vi.fn()
  })

  it('renders grouped context mention results', () => {
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={vi.fn()}
        searchQuery="123"
        anchorPosition={{ top: 0, left: 0 }}
        containerWidth={480}
      />
    )

    expect(screen.getByText('GitHub Issues')).toBeInTheDocument()
    expect(screen.getByText('GitHub Pull Requests')).toBeInTheDocument()
    expect(screen.getByText('#123')).toBeInTheDocument()
    expect(screen.getByText('Fix login bug')).toBeInTheDocument()
    expect(screen.getByText('PR #45')).toBeInTheDocument()
  })

  it('searches from the menu without changing the chat query', () => {
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={vi.fn()}
        searchQuery="123"
        anchorPosition={{ top: 0, left: 0 }}
      />
    )

    const search = screen.getByRole('combobox', {
      name: 'Search issues and context links',
    })
    fireEvent.change(search, { target: { value: 'login failure details' } })

    expect(useContextMentionDataMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: 'login failure details' })
    )
    fireEvent.change(search, { target: { value: '' } })
    expect(useContextMentionDataMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: '123' })
    )
  })

  it('selects a search result with the keyboard', () => {
    const onSelectContext = vi.fn()
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={onSelectContext}
        searchQuery=""
        anchorPosition={{ top: 0, left: 0 }}
      />
    )

    const search = screen.getByRole('combobox', {
      name: 'Search issues and context links',
    })
    fireEvent.keyDown(search, { key: 'ArrowDown' })
    fireEvent.keyDown(search, { key: 'Enter' })

    expect(onSelectContext).toHaveBeenCalledWith(items[1], false)
  })

  it('offers separate add and investigate actions for issues and PRs', () => {
    const onSelectContext = vi.fn()
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={onSelectContext}
        searchQuery=""
        anchorPosition={{ top: 0, left: 0 }}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Add #123 to session context' })
    )
    expect(onSelectContext).toHaveBeenCalledWith(items[0], false)

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Add PR #45 and insert investigation prompt',
      })
    )
    expect(onSelectContext).toHaveBeenCalledWith(items[1], true)
  })

  it('uses Shift+Enter to investigate the selected issue', () => {
    const onSelectContext = vi.fn()
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={onSelectContext}
        searchQuery=""
        anchorPosition={{ top: 0, left: 0 }}
      />
    )

    fireEvent.keyDown(screen.getByRole('combobox'), {
      key: 'Enter',
      shiftKey: true,
    })
    expect(onSelectContext).toHaveBeenCalledWith(items[0], true)
  })

  it('shows keyboard hints on native desktop', () => {
    platform.native = true
    render(
      <ContextMentionPopover
        projectPath="/tmp/repo"
        projectId="project-1"
        open
        onOpenChange={vi.fn()}
        onSelectContext={vi.fn()}
        searchQuery=""
        anchorPosition={{ top: 0, left: 0 }}
      />
    )

    expect(screen.getByText('Shift+Enter')).toBeInTheDocument()
  })

  it('hides keyboard hints on mobile and web access', () => {
    platform.native = true
    platform.mobile = true
    const props = {
      projectPath: '/tmp/repo',
      projectId: 'project-1',
      open: true,
      onOpenChange: vi.fn(),
      onSelectContext: vi.fn(),
      searchQuery: '',
      anchorPosition: { top: 0, left: 0 },
    }
    const { rerender } = render(<ContextMentionPopover {...props} />)
    expect(screen.queryByText('Shift+Enter')).not.toBeInTheDocument()

    platform.native = false
    platform.mobile = false
    rerender(<ContextMentionPopover {...props} />)
    expect(screen.queryByText('Shift+Enter')).not.toBeInTheDocument()
  })
})
