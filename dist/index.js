"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class idbEasy {
    constructor(indexDBName, dataTableName, keyPath = null, autoIncrement = true, createIndexes = [], version = 1) {
        this.dbName = indexDBName;
        this.version = version;
        this.dataTableName = dataTableName;
        this.keyPath = keyPath;
        this.autoIncrement = autoIncrement;
        this.createIndex = createIndexes;
    }
    close() {
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
    open(versionUpgradeFlag = false) {
        return this.init(versionUpgradeFlag);
    }
    init(versionUpgradeFlag = false) {
        return new Promise((resolve, reject) => {
            let request;
            if (!versionUpgradeFlag) {
                request = window.indexedDB.open(this.dbName);
            }
            else {
                request = window.indexedDB.open(this.dbName, this.version);
            }
            request.onerror = (event) => {
                reject(event);
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onblocked = (event) => {
                location.reload();
            };
            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                if (!this.db.objectStoreNames.contains(this.dataTableName)) {
                    const objectStore = this.db.createObjectStore(this.dataTableName, {
                        keyPath: this.keyPath,
                        autoIncrement: this.autoIncrement,
                    });
                    if (this.createIndex) {
                        this.createIndex.forEach((item) => {
                            objectStore.createIndex(item.indexName, item.keyPath, item.options);
                        });
                    }
                }
            };
        });
    }
    getObjectStore(tableName = this.dataTableName, readType) {
        if (this.db) {
            const transaction = this.db.transaction([tableName], readType);
            return transaction.objectStore(tableName);
        }
        else {
            throw new Error("Database not yet open");
        }
    }
    handleRequest(request, resolve, reject) {
        request.onsuccess = (event) => {
            resolve(event);
        };
        request.onerror = (event) => {
            reject(event);
        };
    }
    addOrUpdate(type, data, tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readwrite");
            let request;
            if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                request = objectStore[type](data);
            }
            else {
                const dataArray = { items: data };
                request = objectStore[type](dataArray);
            }
            this.handleRequest(request, resolve, reject);
        });
    }
    updateData(id, data, tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readwrite");
            const getRequest = objectStore.get(id);
            getRequest.onsuccess = (event) => {
                const val = event.target.result;
                if (val) {
                    for (const key in data) {
                        if (data.hasOwnProperty(key)) {
                            val[key] = data[key];
                        }
                    }
                    const putRequest = objectStore.put(val);
                    this.handleRequest(putRequest, resolve, reject);
                }
                else {
                    reject(new Error(`No ID was found to be ${id}.`));
                }
            };
            getRequest.onerror = (event) => {
                reject(event);
            };
        });
    }
    queryIndex(id, tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readonly");
            let request = objectStore.get(id);
            request.onsuccess = (event) => {
                if (request.result) {
                    resolve(request.result);
                }
                else {
                    reject(new Error("The query failed with an error, and no data was retrieved."));
                }
            };
            request.onerror = (event) => {
                reject(event);
            };
        });
    }
    remove(id, tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readwrite");
            let request = objectStore.delete(id);
            this.handleRequest(request, resolve, reject);
        });
    }
    deleteDB(dbName) {
        return new Promise((resolve, reject) => {
            let request = window.indexedDB.deleteDatabase(dbName);
            this.handleRequest(request, resolve, reject);
        });
    }
    readAll(tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readonly");
            let request = objectStore.getAll();
            request.onsuccess = (event) => {
                let cursor = event.target.result;
                if (cursor) {
                    resolve(cursor);
                }
                else {
                    reject(new Error("No more entries found."));
                }
            };
            request.onerror = (event) => {
                reject(event);
            };
        });
    }
    readAllTables() {
        return new Promise((resolve, reject) => {
            const objectStoreNames = this.db.objectStoreNames;
            const values = Array.from(objectStoreNames);
            const result = {};
            let completedCount = 0;
            values.forEach(objectStoreName => {
                const objectStore = this.getObjectStore(objectStoreName, "readonly");
                let request = objectStore.getAll();
                request.onsuccess = (event) => {
                    let cursor = event.target.result;
                    if (cursor) {
                        result[objectStoreName] = cursor;
                        completedCount++;
                        if (completedCount == values.length)
                            resolve(result);
                    }
                    else {
                        reject(new Error("No more entries found."));
                    }
                };
            });
        });
    }
    indexQuery(indexName, index, tableName = this.dataTableName) {
        return new Promise((resolve, reject) => {
            const objectStore = this.getObjectStore(tableName, "readonly");
            let request = objectStore.index(indexName).get(index);
            request.onsuccess = (event) => {
                let result = event.target.result;
                if (result) {
                    resolve(result);
                }
                else {
                    reject(new Error("The query failed with an error, and no data was retrieved."));
                }
            };
            request.onerror = (event) => {
                reject(event);
            };
        });
    }
    updateVersion(version, dataTableName, keyPath = null, autoIncrement = true, createIndexes = []) {
        return new Promise((resolve, reject) => {
            this.version = version;
            this.dataTableName = dataTableName;
            this.keyPath = keyPath;
            this.autoIncrement = autoIncrement;
            this.createIndex = createIndexes;
            this.close();
            this.open(true)
                .then((database) => {
                resolve(database);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
}
exports.default = idbEasy;
//# sourceMappingURL=index.js.map