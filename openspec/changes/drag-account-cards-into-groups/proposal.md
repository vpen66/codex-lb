## Why

The Accounts page currently requires operators to open the group editor dialog to change membership. That works, but it adds unnecessary steps to a common workflow when an operator is already looking at member cards and the destination groups in the same view.

Operators need a faster interaction that lets them move a visible account card directly into another group from the Accounts page without leaving the grouped browsing flow.

## What Changes

- Allow operators to drag a member account card from the Accounts page member grid onto a group in the left sidebar to move the account into that group.
- Allow operators to drag a member account card onto the synthetic `Ungrouped` bucket to remove the account from its persisted group.
- Show visible drop-target feedback while dragging so operators can tell which group will receive the account.
- Preserve the existing group dialog workflow as a fallback for bulk edits and group creation.

## Impact

- Specs: `frontend-architecture`
- Frontend: Accounts page drag/drop state, sidebar drop targets, member card drag affordance, and regression tests
- Backend: no contract changes; reuse existing account-group update semantics
