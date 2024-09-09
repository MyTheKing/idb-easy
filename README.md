## idb-easy 介绍

一个简单易用的 IndexedDB 封装库，旨在简化数据库操作，使开发者能够方便地进行数据存储和检索。通过提供实例化的 API，可以轻松管理和操作 IndexedDB 数据库。

## githup

```http
https://github.com/MyTheKing/idb-easy.git
```

## 安装

```
npm install idb-easy
```

## 导入

```js
import idbEasy from 'idb-easy'
```

## 创建实例

```js
const db = new idbEasy(dbName, dataTableName, keyPath, autoIncrement, createIndex,version); 
```

| 属性          | 类型            | 详解                                                         |
| ------------- | --------------- | ------------------------------------------------------------ |
| dbName        | string          | 创建当前数据库的名字                                         |
| dataTableName | string          | 需要在数据库中创建的表（一个版本只能创建一个表）             |
| keyPath       | string \| null  | 默认值：null，当前表里的唯一主键（如果为null，autoIncrement 必须为 true） |
| autoIncrement | boolean         | 默认值：true，是否系统自动递增主键值（数据中没有主键，必须为true，否则添加报错） |
| createIndex   | `Array<object>` | 默认值：[]，创建表里的索引。索引可以帮助你根据某个字段来查询、排序和过滤数据，而不必直接使用主键。(一个表可以创建多个索引) |
| version       | number          | 默认值：1，当前数据库的版本号                                |

createIndex 参数：

- `indexName`：这是索引的名字，用于识别索引。
- `keyPath`：这是要建立索引的字段名或者是描述如何从对象中提取索引键值的路径。它可以是一个字符串或一个字符串数组。
- `options`：这是一个可选的对象，可以包含以下属性：
  - `multiEntry`：布尔值，表示一个对象是否可以在索引中有多个条目。如果 `keyPath` 指向的是一个数组，那么 `multiEntry: true` 表示索引会为数组中的每个元素创建一个单独的索引条目。
  - `unique`：布尔值，表示索引键是否必须是唯一的。如果设置为 `true`，则不允许有相同的键值出现多次。

## 创建数据库

**`open()` 方法**：

- 用于打开一个已存在的 IndexedDB 数据库或创建一个新数据库。该方法返回一个 `Promise` 对象。

```js
let createIndex = [
  {
    indexName: "queryShopId",
    keyPath: "shopId",
    options: {
      unique: true, 
    },
  },
  {
    indexName: "queryShopName",
    keyPath: "shopName",
    options: {
      unique: false, 
    },
  },
]
const db = new idbEasy("test", "data1", "shopId", true, createIndex,1); 
db.open()
  .then(database => {
    console.log("数据库已成功打开:", database);
  })
  .catch(error => {
    console.error("打开数据库失败:", error);
  });
```

## 操作表数据

**`addOrUpdate(type,data,tableName)` 方法**：

- 用于向表中添加和更新数据。该方法返回一个 `Promise` 对象。

该方法需要传递三个值：

- `type`：里面有两个可选值。`add`和`put`
  - `add`：方法用于向对象存储空间添加新的记录。如果试图添加一个已经存在的主键（即对象存储空间中已经有相同主键的记录），`add` 方法会抛出一个错误。
  - `put`：方法用于更新或插入记录。如果提供的记录的主键已经存在于对象存储空间中，`put` 方法会更新现有记录；如果主键不存在，则会插入新的记录。
- `data`：传递的数据。如果不是对象类型（键值对），默认以键`items`赋值进去。
- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）

**注意：**如果是代理对象不可操作，需要进行转换为普通对象。

例如：

```js
JSON.parse(JSON.stringify(value))
```

### 添加

```js
const add = () => {
  list.value.forEach((value) => {
    db.addOrUpdate("add", JSON.parse(JSON.stringify(value)), "data1")
      .then((res) => {
        console.log("添加成功");
      })
      .catch((error) => {
        console.log("添加失败", error);
      });
  });

  db.addOrUpdate("add", 1)
    .then((res) => {
      console.log("添加成功");
    })
    .catch((error) => {
      console.log("添加失败", error);
    });
};
```

### 更新

在这个表中只会去更新主键匹配项，如果没有则添加。该方法返回一个 `Promise` 对象。

```js
let obj = {
  shopId: 107,
  shopMSg: "hhhh"
};

const update = () => {
  db.addOrUpdate("put", obj, "data1")
    .then((res) => {
      console.log("更新成功");
    })
    .catch((error) => {
      console.log(error, "更新");
    });
};
```

## 修改某一项

**`updateData(id,data,tableName)` 方法**：

修改表中匹配主键的某一项。该方法返回一个 `Promise` 对象。

- `id`：主键。
- `data`：需要更改的数据。
- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）。

```js
const updateData = () => {
  db.updateData(108, { shopMsg: "66666", shopName: "6666.66" })
    .then((res) => {
      console.log("更新成功");
    })
    .catch((error) => {
      console.log(error, "更新失败");
    });
};
```

## 版本更新

**`updateVersion(version, dataTableName, keyPath, autoIncrement, createIndex)` 方法**：

参数介绍可查看上文**创建实例**

```js
const updateVersion = () => {  
  let createIndex =  [
  {
    indexName: "phone",
    keyPath: "shopTel",
    options: {
      unique: false,
    }
  }
]
  db.updateVersion(6,"data2","shopId", true, createIndex)
    .then((database) => {
      console.log("数据库已更新:", database);
    })
    .catch((error) => {
      console.error("更新数据库失败:", error);
    })
};
```

## 查询表中指定主键项数据

**`queryDB(id,tableName)` 方法**：

- `id`：主键。
- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）。

```js
const queryIndex = () => {
  db.queryDB(101,"data1")
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error);
    });
};
```

## 读取某一个表的数据

**`readAll(tableName)` 方法**：

- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）。

```js
const readAll = () => {
  db.readAll("data1")
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error, "读取数据失败");
    });
};
```

## 读取数据库中所有表的数据

**`readAllTables()` 方法**：

```js
const readAllTables = () => {
  db.readAllTables()
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error, "读取数据失败");
    });
};
```

## 索引查询

**`indexQuery(indexName,index,tableName)` 方法**：

- `indexName`：索引名。
- `index`：索引路径
- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）。

```js

const indexQuery = () => {
  db.indexQuery("phone", "13312345678","data2")
    .then((res) => {
      console.log(res);
    })
    .catch((error) => {
      console.log(error, "查询失败");
    });
};
```

## 删除表中指定主键项数据

**`remove(id,tableName)` 方法**：

- `id`：主键。
- `tableName`：操作目标的表。（默认跟随创建当前版本的表名）。

```js
const remove = () => {
  db.remove(102, "data2")
    .then((res) => {
      console.log("删除成功");
    })
    .catch((error) => {
      console.log(error, "删除失败");
    });
};
```

## 删除数据库

**`deleteDB(dbName)` 方法**：

- `dbName`：数据库的名字。

```js
const deleteDB = () => {
  db.deleteDB("test")
    .then((res) => {
      console.log("删除成功" + res);
    })
    .catch((err) => {
      console.log("删除失败" + err);
    });
    location.reload()
};
```

**注意：**` window.indexedDB.deleteDatabase(name)`有遗留bug，删除成功不会触发回调，删除失败会走onsuccess（then）



















