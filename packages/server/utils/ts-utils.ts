export type WithoutMethods<T> = {
  [K in keyof T as T[K] extends Function ? never : K]: T[K] extends object
    ? T[K] extends Array<infer U>
      ? U extends object
        ? Array<WithoutMethods<U>>
        : T[K]
      : T[K] extends Date
        ? T[K]
        : WithoutMethods<T[K]>
    : T[K];
};
