// src/utils/getHandles.ts
'use strict';

import axios from "axios";
import { db, repodb, TABLE as DEFAULT_TABLE } from "../db/knex.js";

const REPO_HANDLE_URL = process.env.REPO_HANDLE_URL || "http://hdl.handle.net/10176/";
const REPO_SIP_UUID   = process.env.REPO_SIP_UUID   || "a5efb5d1-0484-429c-95a5-15c12ff40ca0";
const REPO_TABLE      = process.env.REPO_TABLE      || "tbl_objects";

export async function addHandlesForCallNumbers(
  records: Record<string, any>[],
  tableName: string = DEFAULT_TABLE as string,
  sipUUID: string = REPO_SIP_UUID,
  type: string = "collection",
): Promise<Record<string, any>[]> {
  // Collect call_numbers for rows we are inserting (to target handle updates)
  const targetCallNumbers: string[] = Array.from(
    new Set(
      records.map((r) => r.call_number)
        .filter((v: any) => typeof v === "string" && v.trim().length > 0)
    )
  );

  // Fetch sip_uuids from the repo DB for all call numbers
  const repoRecords = await repodb.select('sip_uuid', 'call_number').from(
    repodb(REPO_TABLE).select('sip_uuid')
      .jsonExtract('mods', '$.identifiers[0].identifier', 'call_number').as('inner_table')
      .where({ is_member_of_collection: sipUUID })
  ).whereIn('call_number', targetCallNumbers);

  return records.map(record => {
    const repoRecord = repoRecords.find(r => r.call_number === record.call_number);
    return repoRecord ? {
      ...record,
      handle: `${REPO_HANDLE_URL}${repoRecord.sip_uuid}`,
      is_processed: true
    } : record;
  });
}
