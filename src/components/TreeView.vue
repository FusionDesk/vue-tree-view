<template>
  <div class="tree-view">
    <ul ref="treeList">
      <li
        v-for="[id, item] in sortedItems"
        :key="id"
        class="cursor-pointer"
        @click.right.stop="onRightClick"
        @click.stop="onItemClick(item)"
        :data-id="id"
      >
        <div class="flex items-center">
          <button
            class="mr-2 text-gray-700 dark:text-gray-400"
            :style="{ visibility: item.folder ? 'visible' : 'hidden' }"
            @click.stop="item.open = !item.open"
          >
            <FontAwesomeIcon
              :icon="item.open ? 'fa-regular fa-minus-square' : 'fa-regular fa-plus-square'"
            />
          </button>
          <button
            class="mr-2 text-gray-700 dark:text-gray-400"
            @click.stop="
              item.selected = !item.selected;
              persistCheckboxState(item);
              emit(item.selected ? 'item-select' : 'item-unselect', item);
            "
          >
            <FontAwesomeIcon
              icon="fa-solid fa-check-square"
              v-if="calculateCheckboxState(item) === true"
            />
            <FontAwesomeIcon
              icon="fa-regular fa-square"
              v-if="calculateCheckboxState(item) === false"
            />
            <FontAwesomeIcon
              icon="fa-solid fa-minus-square"
              v-if="calculateCheckboxState(item) === null"
            />
          </button>
          <FontAwesomeIcon
            v-if="showIcons && item.folder"
            class="mr-2 text-gray-700 dark:text-gray-400"
            :icon="item.icon ? item.icon : 'fa-solid fa-folder'"
          />
          <FontAwesomeIcon
            v-if="showIcons && !item.folder"
            class="mr-2 text-gray-700 dark:text-gray-400"
            :icon="item.icon ? item.icon : 'fa-solid fa-file-alt'"
          />
          <span class="text-sm text-gray-900 dark:text-white" v-if="!item.isEditing">{{
            item.text
          }}</span>
          <span class="text-sm text-gray-900 dark:text-white" v-if="item.isEditing">
            <input
              type="text"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block w-full dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              v-model="item.newText"
              @keydown.enter="
                item.text = item.newText;
                item.isEditing = false;
                emit('change', item);
              "
              @keydown.esc="
                item.newText = item.text;
                item.isEditing = false;
              "
            />
          </span>
        </div>
        <TreeView
          :data="Array.from(item.children.values())"
          :showIcons="showIcons"
          :folderName="props.folderName"
          :itemName="props.itemName"
          :parent="item"
          :group="sortableGroup"
          v-if="item.folder && item.open"
          class="ms-3"
          @item-click="onItemClick"
          @item-select="emit('item-select', $event)"
          @item-unselect="emit('item-unselect', $event)"
          @create="emit('create', $event)"
          @delete="emit('delete', $event)"
          @change="emit('change', $event)"
        />
      </li>
    </ul>
    <!-- Right-Click Menu -->
    <ContextMenu
      ref="contextmenu"
      class="tree-list-contextmenu"
      :x="contextMenuX"
      :y="contextMenuY"
      v-show="showContextMenu"
      :menu="menuItems"
      @item-click="closeMenu"
    />
  </div>
</template>

<script setup>
import { ref, unref, computed, watchEffect, onMounted, onBeforeUnmount } from "vue";
import Sortable from "sortablejs";
import { computePosition } from "@floating-ui/dom";
import ContextMenu from "./ContextMenu.vue";
import { useContextMenu } from "@/composables/contextMenu.js";
import { v4 as uuid } from "uuid";
import { useTreeView } from "../composables/treeView";

const { createNode, nodeRegistry } = useTreeView();

const treeList = ref(null);
const items = ref(new Map());

const sortedItems = computed(() => {
  const sorted = new Map([...items.value.entries()].sort((a, b) => a[1].order - b[1].order));
  return sorted;
});

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
  showIcons: {
    type: Boolean,
    default: true,
  },
  folderName: {
    type: String,
    default: "Folder",
  },
  itemName: {
    type: String,
    default: "Item",
  },
  parent: {
    type: Object,
    default: null,
  },
  group: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  "change",
  "create",
  "delete",
  "item-click",
  "item-select",
  "item-unselect",
]);

watchEffect(() => {
  console.log("Loading data...", props.data);
  items.value.clear();
  for (let item of props.data) {
    if (item.id) {
      item.setItems(unref(items));
    } else {
      item = createNode(item, unref(items), props.parent);
    }
    items.value.set(item.id, item);
  }
});

const persistCheckboxState = (item) => {
  if (item.children.size > 0) {
    item.children.forEach((child) => {
      child.selected = item.selected;
      persistCheckboxState(child);
    });
  }
};

const calculateCheckboxState = (item) => {
  if (item.children.size > 0) {
    const selectedChildren = Array.from(item.children).filter(
      (child) => calculateCheckboxState(child[1]) !== false,
    );
    if (selectedChildren.length === item.children.size) {
      return true;
    } else if (selectedChildren.length === 0) {
      return false;
    } else {
      return null;
    }
  } else {
    return item.selected;
  }
};

let sortable;
const sortableGroup = ref(uuid());
if (props.group) {
  sortableGroup.value = props.group;
}
onMounted(() => {
  const el = treeList.value;
  console.log("Creating sortable", el, sortableGroup.value);
  sortable = Sortable.create(el, {
    animation: 150,
    ghostClass: "tree-list-ghost",
    group: sortableGroup.value,
    onEnd: (evt) => {
      console.log(evt);
      // Update order of nodes
      const children = evt.srcElement.querySelectorAll("li");
      for (const index in children) {
        const childEl = children[index];
        if (!(childEl instanceof HTMLElement)) {
          continue;
        }
        const node = nodeRegistry.getNode(childEl.dataset.id);
        node.order = index;
        emit("change", node);
      }
    },
    onAdd: (evt) => {
      console.log("Added item", evt.item.dataset.index, evt.item.dataset.id);
      // Get node from store
      const node = nodeRegistry.getNode(evt.item.dataset.id);
      // Remove node from old list
      node.removeFromList();
      // Add node to new list
      node.addToList(unref(items), props.parent);
      // Emit change event
      emit("change", node);
    },
  });
});

onBeforeUnmount(() => {
  sortable.destroy();
});

const contextmenu = ref(null);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const menuItems = ref([]);

const contextMenuStore = useContextMenu();
const { id: menuId, showMenu: showContextMenu } = contextMenuStore.registerMenu(contextmenu);

const onRightClick = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  // Ignore right-clicks on the context menu itself
  if (e.srcElement.closest(".tree-list-contextmenu")) {
    return;
  }
  // Get the element that was right-clicked
  const el = e.srcElement.closest("li");
  console.log("Element", el, e.srcElement);
  // Get the context menu
  const menu = el.closest(".tree-view").querySelectorAll(".tree-list-contextmenu")[0];
  // Compute the position of the context menu
  const { x, y } = await computePosition(e.srcElement, menu);
  console.log("Position", x, y);
  // Get the item node
  const item = items.value.get(el.dataset.id);
  console.log("Item", item);
  menuItems.value.splice(0, menuItems.value.length);
  if (item.folder) {
    menuItems.value.push([
      {
        text: `New ${props.folderName}`,
        action: () => {
          const node = createNode(
            { text: `New ${props.folderName}`, folder: true },
            unref(items),
            item,
          );
          item.addChild(node);
          emit("create", node);
        },
      },
      {
        text: `New ${props.itemName}`,
        action: () => {
          const node = createNode(
            { text: `New ${props.itemName}`, folder: false },
            unref(items),
            item,
          );
          item.addChild(node);
          emit("create", node);
        },
      },
    ]);
  }
  menuItems.value.push(
    ...[
      [
        {
          text: "Insert Before",
          action: () => {
            const node = createNode(
              { text: `New ${props.itemName}`, folder: item.folder },
              unref(items),
              props.parent,
            );
            item.insertBefore(node);
            emit("create", node);
          },
        },
        {
          text: "Insert After",
          action: () => {
            const node = createNode(
              { text: `New ${props.itemName}`, folder: item.folder },
              unref(items),
              props.parent,
            );
            item.insertAfter(node);
            emit("create", node);
          },
        },
      ],
      [
        {
          text: "Rename",
          action: () => {
            item.isEditing = true;
          },
        },
        {
          text: "Delete",
          action: () => {
            item.delete();
            emit("delete", item);
          },
        },
      ],
    ],
  );
  // Show the context menu
  contextMenuX.value = x;
  contextMenuY.value = y;
  contextMenuStore.showMenu(menuId);
};

const closeMenu = () => {
  contextMenuStore.hideMenu(menuId);
};

const onItemClick = (item) => {
  emit("item-click", item);
};
</script>

<style>
.tree-list-ghost {
  @apply text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400;
}
</style>
