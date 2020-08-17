import { setDevtoolsHook } from '@vue/runtime-dom'
import { getGlobalThis } from '@vue/shared'

export function initDev() {
  // 获取全局的this
  const target = getGlobalThis()

  // 全局注入__VUE__ flag
  target.__VUE__ = true
  // 设置devtools的hook对象 用来相互调用
  setDevtoolsHook(target.__VUE_DEVTOOLS_GLOBAL_HOOK__)

  // 如果是浏览器环境 提示信息
  if (__BROWSER__) {
    console.info(
      `You are running a development build of Vue.\n` +
        `Make sure to use the production build (*.prod.js) when deploying for production.`
    )
  }
}
