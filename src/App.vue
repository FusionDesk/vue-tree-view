<script setup>
import { ref } from 'vue'
import TreeView from './components/TreeView.vue'

const data = ref([
  {
    text: 'Parent 1',
    open: true,
    selected: false,
    folder: true,
    children: [
      {
        text: 'Child 1',
        open: true,
        selected: false,
        folder: true,
        children: [
          {
            text: 'Grandchild 1',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 1
            }
          },
          {
            text: 'Grandchild 2',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 2
            }
          }
        ],
        data: {
          id: 3
        }
      },
      {
        text: 'Child 2',
        open: true,
        selected: false,
        folder: true,
        children: [
          {
            text: 'Grandchild 1',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 3
            }
          },
          {
            text: 'Grandchild 2',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 4
            }
          }
        ],
        data: {
          id: 4
        }
      }
    ],
    data: {
      id: 1
    }
  },
  {
    text: 'Parent 2',
    open: true,
    selected: false,
    folder: true,
    children: [
      {
        text: 'Child 1',
        open: true,
        selected: false,
        folder: true,
        children: [
          {
            text: 'Grandchild 1',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 5
            }
          },
          {
            text: 'Grandchild 2',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 6
            }
          }
        ],
        data: {
          id: 5
        }
      },
      {
        text: 'Child 2',
        open: true,
        selected: false,
        folder: true,
        children: [
          {
            text: 'Grandchild 1',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 7
            }
          },
          {
            text: 'Grandchild 2',
            open: true,
            selected: false,
            children: [],
            data: {
              id: 8
            }
          }
        ],
        data: {
          id: 6
        }
      }
    ],
    data: {
      id: 2
    }
  }
])
</script>

<template>
  <TreeView :data="data" />
</template>

<style scoped></style>
