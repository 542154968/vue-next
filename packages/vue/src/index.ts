// This entry is the "full-build" that includes both the runtime
// 这个条目是包含两个运行时的“完整构建”
// and the compiler, and supports on-the-fly compilation of the template option.
// 以及编译器，并支持动态编译模板选项。
import { initDev } from './dev'
import { compile, CompilerOptions, CompilerError } from '@vue/compiler-dom'
import { registerRuntimeCompiler, RenderFunction, warn } from '@vue/runtime-dom'
import * as runtimeDom from '@vue/runtime-dom'
import { isString, NOOP, generateCodeFrame, extend } from '@vue/shared'
import { InternalRenderFunction } from 'packages/runtime-core/src/component'

// __DEV__ 定义在了 rollup.config.js中209行 同时 global.d.ts中定义了它的类型
// 返回的是一个布尔类型的值 判断是否是dev环境
// h含有bundler 和 browser两种类型作为判断
// dev环境初始化
__DEV__ && initDev()

// 一个纯净的对象
const compileCache: Record<string, RenderFunction> = Object.create(null)

function compileToFunction(
  template: string | HTMLElement,
  options?: CompilerOptions
): RenderFunction {
  /**
   * 第一步先判断是不是dom对象  如果是dom对象 就提取出它的innerHTML作为模板
   */
  // 如果传进来的是 HTMLElement对象
  if (!isString(template)) {
    // 如果nodeType存在 即是一个dom对象
    if (template.nodeType) {
      // template就是它里面的innerHTLM
      template = template.innerHTML
    } else {
      // 如果传进来的不是dom对象 报错 返回空对象
      __DEV__ && warn(`invalid template option: `, template)
      return NOOP
    }
  }

  /**
   * 缓存template
   */
  const key = template
  const cached = compileCache[key]
  if (cached) {
    return cached
  }

  /**
   * 如果传入的是个id标识  compileToFunction('#app')
   * 查找这个id标识并获得里面的dom字符串结构
   * 如果 没找到这个id标识  返回的template是空的
   * */

  if (template[0] === '#') {
    const el = document.querySelector(template)
    if (__DEV__ && !el) {
      warn(`Template element not found or is empty: ${template}`)
    }
    // __UNSAFE__
    //不安全__
    // Reason: potential execution of JS expressions in in-DOM template.
    //原因：可能会在in-DOM模板中执行JS表达式。
    // The user must make sure the in-DOM template is trusted. If it's rendered
    //用户必须确保in-DOM模板是可信的。如果它被渲染
    // by the server, the template should not contain any user data.
    //对于服务器，模板不应包含任何用户数据。
    template = el ? el.innerHTML : ``
  }

  const { code } = compile(
    template,
    extend(
      {
        hoistStatic: true,
        onError(err: CompilerError) {
          if (__DEV__) {
            const message = `Template compilation error: ${err.message}`
            const codeFrame =
              err.loc &&
              generateCodeFrame(
                template as string,
                err.loc.start.offset,
                err.loc.end.offset
              )
            warn(codeFrame ? `${message}\n${codeFrame}` : message)
          } else {
            /* istanbul ignore next */
            throw err
          }
        }
      },
      options
    )
  )

  // The wildcard import results in a huge object with every export
  // with keys that cannot be mangled, and can be quite heavy size-wise.
  // In the global build we know `Vue` is available globally so we can avoid
  // the wildcard object.
  const render = (__GLOBAL__
    ? new Function(code)()
    : new Function('Vue', code)(runtimeDom)) as RenderFunction

  // mark the function as runtime compiled
  ;(render as InternalRenderFunction)._rc = true

  return (compileCache[key] = render)
}

registerRuntimeCompiler(compileToFunction)

export { compileToFunction as compile }
export * from '@vue/runtime-dom'
