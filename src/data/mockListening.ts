/**
 * 历史兼容 shim:旧引用 `MOCK_LISTENING` 仍然可用,实际指向 v1.8 起新设计的素材库。
 * 新代码请直接 import `LISTENING_ITEMS` from "@/data/listeningItems"。
 */
export {
  LISTENING_ITEMS as MOCK_LISTENING,
  getListeningById
} from "./listeningItems";
