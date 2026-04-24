## Why

Account groups can contain weekly-only accounts that do not expose a real 5-hour quota window. The current group aggregation still sums their nominal 5-hour capacity while treating missing remaining credits as zero, which produces a misleading `5h Remaining` value on dashboard and accounts group cards.

## What Changes

- exclude accounts without a primary usage window from group-level 5-hour quota aggregation
- keep weekly aggregation unchanged for accounts that still expose a secondary window
- add regression coverage for weekly-only group aggregation

## Impact

- grouped quota summaries align with the per-account cards for weekly-only plans
- operators no longer see a fake depleted 5-hour bar for groups that have no 5-hour data
