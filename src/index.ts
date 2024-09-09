interface createIndexConfig {
  indexName: string;
  keyPath: string;
  options: { unique: boolean, multiEntry: boolean };
}

export default class idbEasy {
  private dbName: string;
  private version: number;
  private dataTableName: string;
  private keyPath: string | null;
  private autoIncrement: boolean;
  private db: IDBDatabase | any;
  private createIndex: createIndexConfig[];

  constructor(
    indexDBName: string,
    dataTableName: string,
    keyPath: string | null = null,
    autoIncrement = true,
    createIndexes: createIndexConfig[] = [],
    version: number = 1,
  ) {
    this.dbName = indexDBName;
    this.version = version;
    this.dataTableName = dataTableName;
    this.keyPath = keyPath;
    this.autoIncrement = autoIncrement;
    this.createIndex = createIndexes;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  public open(versionUpgradeFlag = false): Promise<IDBDatabase> {
    return this.init(versionUpgradeFlag);
  }

  private init(versionUpgradeFlag = false): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      let request: IDBOpenDBRequest;
      if (!versionUpgradeFlag) {
         request = window.indexedDB.open(this.dbName);
      } else {
         request = window.indexedDB.open(this.dbName, this.version);
      }
      

      request.onerror = (event:any) => {
        reject(event);
      };
      request.onsuccess = (event:any) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      request.onblocked = (event:any) => {
        location.reload();
      };

      request.onupgradeneeded = (event:any) => {
        this.db = (
          (event as IDBVersionChangeEvent).target as IDBOpenDBRequest
        ).result;

        if (!this.db.objectStoreNames.contains(this.dataTableName)) {
          const objectStore = this.db.createObjectStore(this.dataTableName, {
            keyPath: this.keyPath,
            autoIncrement: this.autoIncrement,
          });

          if (this.createIndex) {
            this.createIndex.forEach((item) => {
              objectStore.createIndex(
                item.indexName,
                item.keyPath,
                item.options
              );
            });
          }
        }
      };
    });
  }

  private getObjectStore(
    tableName = this.dataTableName,
    readType: "readonly" | "readwrite" | "versionchange"
  ): IDBObjectStore {
    if (this.db) {
      const transaction = this.db.transaction([tableName], readType);
      return transaction.objectStore(tableName);
    } else {
      throw new Error("Database not yet open");
    }
  }

  private handleRequest<T>(
    request: IDBRequest<T>,
    resolve: any,
    reject: any
  ): any {
    request.onsuccess = (event: any) => {
      resolve(event);
    };

    request.onerror = (event: any) => {
      reject(event);
    };
  }

  public addOrUpdate<T>(
    type: "add" | "put",
    data: T | T[],
    tableName = this.dataTableName
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readwrite");

      let request: IDBRequest<any>;

      if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
        request = objectStore[type](data);
      } else {
        const dataArray = { items: data };
        request = objectStore[type](dataArray);
      }

      this.handleRequest(request, resolve, reject);
    });
  }

  public updateData<T>(
    id: string | number,
    data: T,
    tableName = this.dataTableName
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readwrite");
      const getRequest = objectStore.get(id);

      getRequest.onsuccess = (event: any) => {
        const val = event.target.result;
        if (val) {
          for (const key in data) {
            if (data!.hasOwnProperty(key)) {
              val[key] = data[key];
            }
          }

          const putRequest = objectStore.put(val);

          this.handleRequest(putRequest, resolve, reject);
        } else {
          reject(new Error(`No ID was found to be ${id}.`));
        }
      };

      getRequest.onerror = (event: any) => {
        reject(event);
      };
    });
  }

  public queryIndex(
    id: number | string,
    tableName = this.dataTableName
  ): Promise<Array<any> | Object> {
    return new Promise<Array<any> | Object>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readonly");
      let request = objectStore.get(id);
      request.onsuccess = (event: any) => {
        if (request.result) {
          resolve(request.result);
        } else {
          reject(
            new Error(
              "The query failed with an error, and no data was retrieved."
            )
          );
        }
      };
      request.onerror = (event: any) => {
        reject(event);
      };
    });
  }

  public remove(
    id: number | string,
    tableName = this.dataTableName
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readwrite");
      let request = objectStore.delete(id);
      this.handleRequest(request, resolve, reject);
    });
  }

  public deleteDB(dbName: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      let request = window.indexedDB.deleteDatabase(dbName);
      this.handleRequest(request, resolve, reject);
    });
  }

  public readAll(tableName = this.dataTableName): Promise<Array<any> | Object> {
    return new Promise<Array<any> | Object>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readonly");
      let request = objectStore.getAll();

      request.onsuccess = (event: any) => {
        let cursor = event.target.result;
        if (cursor) {
          resolve(cursor);
        } else {
          reject(new Error("No more entries found."));
        }
      };

      request.onerror = (event: any) => {
        reject(event);
      };
    });
  }

  public readAllTables(): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      const objectStoreNames = this.db.objectStoreNames;
      const values = Array.from(objectStoreNames);
      const result = {} as { [key: string]: any };
      let completedCount = 0;
      values.forEach(objectStoreName => {
        const objectStore = this.getObjectStore(
          objectStoreName as string,
          "readonly"
        );
        let request = objectStore.getAll();
        request.onsuccess = (event: any) => {
          let cursor = event.target.result;
          if (cursor) {
            result[objectStoreName as string] = cursor;
            completedCount++
            if (completedCount == values.length) resolve(result);
          } else {
            reject(new Error("No more entries found."));
          }
        };
      });
    });
  }

  public indexQuery(
    indexName: string,
    index: string | number,
    tableName = this.dataTableName
  ): Promise<Array<any> | Object> {
    return new Promise<Array<any> | Object>((resolve, reject) => {
      const objectStore = this.getObjectStore(tableName, "readonly");
      let request = objectStore.index(indexName).get(index);

      request.onsuccess = (event: any) => {
        let result = event.target.result;
        if (result) {
          resolve(result);
        } else {
          reject(
            new Error(
              "The query failed with an error, and no data was retrieved."
            )
          );
        }
      };

      request.onerror = (event: any) => {
        reject(event);
      };
    });
  }

  public updateVersion(
    version: number,
    dataTableName: string,
    keyPath: string | null = null,
    autoIncrement = true,
    createIndexes: createIndexConfig[] = []
  ): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.version = version;
      this.dataTableName = dataTableName;
      this.keyPath = keyPath;
      this.autoIncrement = autoIncrement;
      this.createIndex = createIndexes;
      this.close();

      this.open(true)
        .then((database) => {
          resolve(database)
        })
        .catch((error) => {
          reject(error)
        })
    });
  }
}