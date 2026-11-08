import { watch } from 'chokidar';
import { debounce } from './debounce.mjs';

export function watchWorkbook(filePath, onChange, { debounceMs }) {
  const watcher = watch(filePath, { ignoreInitial: true });
  watcher.on('change', debounce(onChange, debounceMs));
  return watcher;
}
