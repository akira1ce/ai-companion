import { MarkdownTextSplitter, RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/* 普通文本分割 */
const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 500, // 每个块的最大字符数
  chunkOverlap: 50, // 相邻块之间的重叠字符数
});

const text = `React Hooks 是 React 16.8 引入的新特性。

useState 是最基础的 Hook，用于在函数组件中管理状态。
它返回一个状态值和一个更新函数。

useEffect 用于处理副作用。它在组件渲染后执行，
可以通过依赖数组控制执行时机。清理函数会在组件
卸载时或下一次 effect 执行前被调用。

useRef 用于创建一个可变的引用对象。它的 .current
属性不会触发重新渲染，适合存储 DOM 引用或任意可变值。`;

const chunks = await splitter.createDocuments([text]);

chunks.forEach((chunk, i) => {
  console.log(`--- Chunk ${i} (${chunk.pageContent.length} chars) ---`);
  console.log(chunk.pageContent);
});

console.log("--------------------------------");

/* typescript 分割 */
const tsSplitter = RecursiveCharacterTextSplitter.fromLanguage("js", {
  chunkSize: 1000,
  chunkOverlap: 100,
});

const code = `
function useCounter(initial: number = 0) {
  const [count, setCount] = useState(initial)

  const increment = useCallback(() => {
    setCount(prev => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCount(prev => prev - 1)
  }, [])

  return { count, increment, decrement }
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
`;

const tsChunks = await tsSplitter.createDocuments([code]);

tsChunks.forEach((chunk, i) => {
  console.log(`--- Chunk ${i} (${chunk.pageContent.length} chars) ---`);
  console.log(chunk.pageContent);
});

console.log("--------------------------------");

/* markdown 分割 */
const markdownSplitter = new MarkdownTextSplitter({
  chunkSize: 800,
  chunkOverlap: 100,
});

const markdown = `
# React Hooks 指南

## useState

useState 是最基础的 Hook，用于在函数组件中管理状态。

### 基本用法

调用 useState 会返回一个数组，第一个元素是当前状态值，
第二个元素是更新状态的函数。

### 惰性初始化

如果初始状态需要复杂计算，可以传一个函数给 useState，
这个函数只在首次渲染时执行。

## useEffect

useEffect 用于处理副作用，比如数据请求、订阅、DOM 操作等。

### 依赖数组

通过依赖数组控制 effect 的执行时机。
空数组表示只在挂载时执行一次。

### 清理函数

返回一个函数作为清理逻辑，会在组件卸载时
或下一次 effect 执行前被调用。
`;

const markdownChunks = await markdownSplitter.createDocuments([markdown]);

markdownChunks.forEach((chunk, i) => {
  console.log(`--- Chunk ${i} (${chunk.pageContent.length} chars) ---`);
  console.log(chunk.pageContent);
});
