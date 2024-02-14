import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import TreeView from '../TreeView.vue.vue'

describe('TreeView', () => {
  it('renders properly', () => {
    const wrapper = mount(TreeView, { props: { msg: 'Hello Vitest' } })
    expect(wrapper.text()).toContain('Hello Vitest')
  })
})
