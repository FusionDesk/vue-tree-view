import { ref } from "vue";
import { onClickOutside } from "@vueuse/core";

const menus = new Map();

const registerMenu = (menu) => {
  // Create new id for menu
  const id = Symbol();
  // Create new ref for menu
  const showMenu = ref(false);
  menus.set(id, {
    menu: menu,
    show: showMenu,
    clickOutsideHandler: onClickOutside(menu, () => {
      showMenu.value = false;
    }),
  });
  return { id, showMenu };
};

const showMenu = (id) => {
  const menu = menus.get(id);
  hideOtherMenus(id);
  menu.show.value = true;
};

const hideMenu = (id) => {
  const menu = menus.get(id);
  menu.show.value = false;
};

const hideOtherMenus = (id) => {
  for (const [key, value] of menus) {
    if (key !== id) {
      value.show.value = false;
    }
  }
};

const destroyMenu = (id) => {
  menus.delete(id);
};

export function useContextMenu() {
  return { registerMenu, showMenu, hideMenu, hideOtherMenus, destroyMenu };
}
