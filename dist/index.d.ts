interface createIndexConfig {
    indexName: string;
    keyPath: string;
    options: {
        unique: boolean;
        multiEntry: boolean;
    };
}
export default class idbEasy {
    private dbName;
    private version;
    private dataTableName;
    private keyPath;
    private autoIncrement;
    private db;
    private createIndex;
    constructor(indexDBName: string, dataTableName: string, keyPath?: string | null, autoIncrement?: boolean, createIndexes?: createIndexConfig[], version?: number);
    close(): void;
    open(versionUpgradeFlag?: boolean): Promise<IDBDatabase>;
    private init;
    private getObjectStore;
    private handleRequest;
    addOrUpdate<T>(type: "add" | "put", data: T | T[], tableName?: string): Promise<any>;
    updateData<T>(id: string | number, data: T, tableName?: string): Promise<any>;
    queryIndex(id: number | string, tableName?: string): Promise<Array<any> | Object>;
    remove(id: number | string, tableName?: string): Promise<any>;
    deleteDB(dbName: string): Promise<any>;
    readAll(tableName?: string): Promise<Array<any> | Object>;
    readAllTables(): Promise<any>;
    indexQuery(indexName: string, index: string | number, tableName?: string): Promise<Array<any> | Object>;
    updateVersion(version: number, dataTableName: string, keyPath?: string | null, autoIncrement?: boolean, createIndexes?: createIndexConfig[]): Promise<any>;
}
export {};
