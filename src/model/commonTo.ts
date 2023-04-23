export interface OffsetSizeIto {
  offsetX: number;
  offsetY: number;
}

export class FileCto {
  path: string;
  ctime: number;
  mtime: number;

  constructor();
  constructor(path: string, ctime: number, mtime: number);
  constructor(path?: string, ctime?: number, mtime?: number) {
    this.path = path;
    this.ctime = ctime;
    this.mtime = mtime;
  }
}


