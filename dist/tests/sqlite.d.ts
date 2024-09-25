export interface SQLiteQuery {
    table: 'User' | 'Post' | 'Category';
    where?: {
        [field: string]: string;
    };
}
export declare function get({ table, where }: SQLiteQuery): Promise<any>;
