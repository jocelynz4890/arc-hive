import { Db } from "npm:mongodb";
import { emit } from "@utils/sse.ts";

export default class EventsConcept {
  // db kept for consistency with other concepts, not used here
  constructor(_db: Db | unknown) {}

  async emit({ event, payload }: { event: string; payload?: unknown }): Promise<{ ok: true }>{
    emit(event, payload);
    return { ok: true };
  }
}


