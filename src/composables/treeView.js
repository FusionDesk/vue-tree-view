import { v4 as uuid } from "uuid";

const preparePath = (data = [], path = [], folder = {}) => {
  if (path.length > 0) {
    let currentFolder = data.find((item) => item.text === path[0]);
    if (!currentFolder) {
      const index = data.length;
      data[index] = {
        text: path[0],
        folder: true,
        open: true,
        children: [],
        order: index,
        data: {},
      };
      currentFolder = data[index];
    }
    return preparePath(currentFolder.children, path.slice(1), folder);
  } else {
    const existingFolder = data.find((item) => item.text === folder.text);
    if (existingFolder) {
      existingFolder.order = folder.order;
      existingFolder.data.id = folder.id;
    } else {
      data.push({
        text: folder.name,
        folder: true,
        open: true,
        children: [],
        order: folder.order,
        data: {
          id: folder.id,
        },
      });
    }
    return data;
  }
};

const addItemToPath = (data = [], path = [], item) => {
  if (path.length === 0) {
    data.push(item);
    return data;
  }
  let folder = data.find((item) => item.text === path[0]);
  if (!folder) {
    const index = data.length;
    data[index] = {
      text: path[0],
      folder: true,
      open: true,
      children: [],
      order: index,
      data: {},
    };
    folder = data[index];
  }
  if (path.length > 1) {
    return addItemToPath(folder.children, path.slice(1), item);
  } else {
    folder.children.push(item);
    return data;
  }
};

// Convert table data to hierarchical data for tree view
const convertFromDB = (folders, items) => {
  let data = [];
  for (const folder of folders) {
    const path = folder.path ? folder.path.split("/") : [];
    preparePath(data, path, folder);
  }
  for (const item of items) {
    const folder = folders.find((folder) => folder.id === item.folderId);
    let path = [];
    if (folder) {
      path = folder.path ? [...folder.path.split("/"), folder.name] : [folder.name];
    }
    addItemToPath(data, path, {
      text: item.name,
      folder: false,
      order: item.order,
      data: {
        id: item.id,
      },
    });
  }
  return data;
};

// Convert hierarchical data to table data for database
const convertToDB = (data, path = []) => {
  const folders = [];
  const items = [];
  for (const item of data) {
    if (item.folder) {
      folders.push({
        id: item.data?.id,
        name: item.text,
        path: path.join("/"),
        order: item.order,
      });
      const { folders: subFolders, items: subItems } = convertToDB(item.children, [
        ...path,
        item.text,
      ]);
      folders.push(...subFolders);
      items.push(...subItems);
    } else {
      items.push({
        id: item.data?.id,
        name: item.text,
        path: path.join("/"),
        order: item.order,
      });
    }
  }
  return { folders, items };
};

const nodeRegistry = {
  nodes: new Map(),
  register(node) {
    this.nodes.set(node.id, node);
  },
  unregister(id) {
    this.nodes.delete(id);
  },
  getNodes() {
    return this.nodes;
  },
  getNode(id) {
    return this.nodes.get(id);
  },
};
window.nodeRegistry = nodeRegistry;

const initializeData = (data) => {
  if (!data) {
    return new Map();
  } else if (data instanceof Map) {
    return data;
  } else {
    return new Map(Object.entries(data));
  }
};

const initializeChildren = (node) => {
  const children = [...node.children];
  node.children = new Map();
  for (const child of children) {
    const newChild = createNode(child, node.items, node);
    node.children.set(newChild.id, newChild);
  }
};

const createNode = (item, items, parent) => {
  if (item.id) {
    return item;
  }
  const id = uuid();
  const node = {
    id: id,
    text: item.text,
    newText: item.text,
    open: item.open === true,
    selected: item.selected === true,
    folder: item.folder === true,
    icon: item.icon,
    children: Array.isArray(item.children) ? item.children : [],
    data: initializeData(item.data),
    order: Number.isInteger(item.order) ? item.order : 1,
    isEditing: false,
    items: items,
    parent: parent,
    setItems(items) {
      this.items = items;
    },
    setParent(parent) {
      this.parent = parent;
    },
    hasData(key) {
      return this.data.has(key);
    },
    getData(key) {
      return this.data.get(key);
    },
    addData(key, value) {
      return this.data.set(key, value);
    },
    removeData(key) {
      return this.data.delete(key);
    },
    getChild(id) {
      return this.children.find((child) => child.id === id);
    },
    addChild(newItem, order = null) {
      console.log("Adding child", newItem, this, order);
      if (order !== null) {
        for (const child of this.children.values()) {
          console.log("Child", child.text, child.order);
          if (child.order >= order) {
            console.log("Setting order", child.text, child.order, child.order + 1);
            child.order += 1;
          }
        }
      } else {
        newItem.order = this.children.size + 1;
      }
      this.children.set(newItem.id, newItem);
    },
    deleteChild(id) {
      this.children.delete(id);
    },
    insertBefore(newItem) {
      newItem.order = this.order;
      console.log("Parent", this.parent);
      if (this.parent) {
        this.parent.addChild(newItem, newItem.order);
      } else {
        items.set(newItem.id, newItem);
        for (const item of items) {
          if (item.order >= newItem.order) {
            item.order += 1;
          }
        }
      }
    },
    insertAfter(newItem) {
      newItem.order = this.order + 1;
      if (this.parent) {
        this.parent.addChild(newItem, newItem.order);
      } else {
        items.set(newItem.id, newItem);
        for (const item of items) {
          if (item.order >= newItem.order) {
            item.order += 1;
          }
        }
      }
    },
    addToList(items, parent) {
      this.setItems(items);
      this.setParent(parent);
      this.items.set(this.id, this);
      if (this.parent) {
        this.parent.addChild(this);
      }
    },
    removeFromList() {
      this.items.delete(this.id);
      if (this.parent) {
        this.parent.deleteChild(this.id);
      }
    },
    delete() {
      this.removeFromList();
      nodeRegistry.unregister(this.id);
    },
  };
  initializeChildren(node);
  nodeRegistry.register(node);
  return node;
};

export function useTreeView() {
  return { convertFromDB, convertToDB, nodeRegistry, createNode, addItemToPath, preparePath };
}
