// src/utils/getHandles.ts
'use strict';

import axios from "axios";
import { db, repodb, TABLE as DEFAULT_TABLE } from "../db/knex.js";

const REPO_HANDLE_URL = process.env.REPO_HANDLE_URL || "http://hdl.handle.net/10176/";
const REPO_SIP_UUID   = process.env.REPO_SIP_UUID   || "a5efb5d1-0484-429c-95a5-15c12ff40ca0";
const REPO_TABLE      = process.env.REPO_TABLE      || "tbl_objects";

interface RepoRecord {
  sip_uuid: string;
  mods: string;
}

async function _fetchAndUpdateHandles(
  tableName: string,
  sipUUID: string | undefined,
  type: string,
  onlyCallNumbers?: Set<string>
): Promise<{ requested: number; updated: number; missing: number }> {

  const q = repodb.select('sip_uuid', 'call_number').from(
    repodb(REPO_TABLE).select('sip_uuid')
      .jsonExtract('mods', '$.identifiers[0].identifier', 'call_number').as('inner_table')
      .where({ is_member_of_collection: sipUUID })
  );

  if (onlyCallNumbers) {
    q.whereIn('call_number', Array.from(onlyCallNumbers));
  }

  const records = await q;

  let updated = 0;
  let missing = 0;
  let remainingTargets = onlyCallNumbers ? onlyCallNumbers.size : undefined;

  for (const record of records) {
    try {
      const call_number: string | undefined = record.call_number;
      if (!call_number) continue;

      const handle = `${REPO_HANDLE_URL}${record.sip_uuid}`;

      const q = db(tableName).where({ call_number });
      if (onlyCallNumbers) {
        q.whereNull("handle"); // do not overwrite when targeting
      }
      const count = await q.update({ handle });

      if (count === 1) {
        updated += 1;
      } else {
        missing += 1; // not found or already had handle (when whereNull applied)
      }
    } catch {
      // process per-row errors to keep other rows going
      missing += 1;
    }
  }

  return { requested: records.length, updated, missing };
}

export async function getRecordUuidsAndUpdateHandlesForCallNumbers(
  tableName: string = DEFAULT_TABLE as string,
  callNumbers: string[] = [],
  sipUUID: string = REPO_SIP_UUID,
  type: string = "collection"
): Promise<{ requested: number; updated: number; missing: number }> {
  const set = new Set((callNumbers || []).filter(Boolean));
  if (set.size === 0) return { requested: 0, updated: 0, missing: 0 };
  return _fetchAndUpdateHandles(tableName, sipUUID, type, set);
}
