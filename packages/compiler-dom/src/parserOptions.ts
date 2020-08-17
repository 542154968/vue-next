import {
  TextModes,
  ParserOptions,
  ElementNode,
  Namespaces,
  NodeTypes,
  isBuiltInType
} from '@vue/compiler-core'
import { makeMap, isVoidTag, isHTMLTag, isSVGTag } from '@vue/shared'
import { TRANSITION, TRANSITION_GROUP } from './runtimeHelpers'
import { decodeHtml } from './decodeHtml'
import { decodeHtmlBrowser } from './decodeHtmlBrowser'

const isRawTextContainer = /*#__PURE__*/ makeMap(
  'style,iframe,script,noscript',
  true
)

export const enum DOMNamespaces {
  HTML = Namespaces.HTML,
  SVG,
  MATH_ML
}

export const parserOptions: ParserOptions = {
  //   'area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr' 判断是否是这些标签 是否是自闭和标签
  isVoidTag,
  // 是否是html和svg的标签
  isNativeTag: tag => isHTMLTag(tag) || isSVGTag(tag),
  // 是否是pre标签
  isPreTag: tag => tag === 'pre',
  // 如果是浏览器环境 获得传入的 node.textContent内容
  // 不是就返回转成ast语法树的结果
  decodeEntities: __BROWSER__ ? decodeHtmlBrowser : decodeHtml,

  // 判断标签 如果是trantion相关的返回 symbol唯一值
  isBuiltInComponent: (tag: string): symbol | undefined => {
    // 判断是否是transiton 和 transitiongroup标签
    // 返回一个symbol唯一值的标签名
    if (isBuiltInType(tag, `Transition`)) {
      return TRANSITION
    } else if (isBuiltInType(tag, `TransitionGroup`)) {
      return TRANSITION_GROUP
    }
  },

  // 命名空间
  // https://html.spec.whatwg.org/multipage/parsing.html#tree-construction-dispatcher
  getNamespace(tag: string, parent: ElementNode | undefined): DOMNamespaces {
    let ns = parent ? parent.ns : DOMNamespaces.HTML

    if (parent && ns === DOMNamespaces.MATH_ML) {
      if (parent.tag === 'annotation-xml') {
        if (tag === 'svg') {
          return DOMNamespaces.SVG
        }
        if (
          parent.props.some(
            a =>
              a.type === NodeTypes.ATTRIBUTE &&
              a.name === 'encoding' &&
              a.value != null &&
              (a.value.content === 'text/html' ||
                a.value.content === 'application/xhtml+xml')
          )
        ) {
          ns = DOMNamespaces.HTML
        }
      } else if (
        /^m(?:[ions]|text)$/.test(parent.tag) &&
        tag !== 'mglyph' &&
        tag !== 'malignmark'
      ) {
        ns = DOMNamespaces.HTML
      }
    } else if (parent && ns === DOMNamespaces.SVG) {
      if (
        parent.tag === 'foreignObject' ||
        parent.tag === 'desc' ||
        parent.tag === 'title'
      ) {
        ns = DOMNamespaces.HTML
      }
    }

    if (ns === DOMNamespaces.HTML) {
      if (tag === 'svg') {
        return DOMNamespaces.SVG
      }
      if (tag === 'math') {
        return DOMNamespaces.MATH_ML
      }
    }
    return ns
  },

  //
  // https://html.spec.whatwg.org/multipage/parsing.html#parsing-html-fragments
  getTextMode({ tag, ns }: ElementNode): TextModes {
    if (ns === DOMNamespaces.HTML) {
      if (tag === 'textarea' || tag === 'title') {
        return TextModes.RCDATA
      }
      if (isRawTextContainer(tag)) {
        return TextModes.RAWTEXT
      }
    }
    return TextModes.DATA
  }
}
