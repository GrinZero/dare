---
title: 内存插件
---

## 介绍

内存插件是基于会话角度的性能监控系列插件，主要作用是通过采集页面生命周期内的performance.memory数据，来分析页面内存使用情况，从而帮助开发者定位内存泄漏问题。

## 使用

```ts
import { defineConfig, memoryPlugin } from '@dare/web-sdk';

defineConfig({
  reporter: {
    url: 'http://localhost:3000/api/report',
  },
  plugins: [
    memoryPlugin({
      interval: 5000, // 可选，默认10000ms
    }),
  ],
});
```

## 设计

:::warning
memoryPlugin插件在非Chrome内核浏览器上静默失效
:::

memoryPlugin设计的目的是为了帮助开发者快速感知到内存泄漏问题，内存泄漏的问题越早发现，越容易解决。单一的memoryPlugin插件实际上只能感知到：

- jsHeapSizeLimit：上下文可用的堆的最大大小（以字节为单位）
- totalJSHeapSize：分配给上下文的堆的总大小（以字节为单位）
- usedJSHeapSize：分配给上下文的堆的当前使用量（以字节为单位）

这些数据除了可以观测出内存泄漏问题、内存溢出问题外，并不能直接定位到具体的内存泄漏代码，正确的做法是将这部分数据结合用户埋点插件、错误插件等其他插件（在会话维度上）等数据进行分析，从而定位到具体的内存泄漏代码。

### 采集数据

memoryPlugin插件采集的数据如下：

```ts
interface MemoryData {
  jsHeapSizeLimit: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
}
```
