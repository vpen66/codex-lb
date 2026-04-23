## ADDED Requirements

### Requirement: Accounts page supports drag-and-drop membership changes

The Accounts page SHALL let operators move a visible member account into another group by dragging the account card onto a group in the sidebar, while preserving existing grouped browsing and account-detail flows.

#### Scenario: Move an account card into another persisted group

- **WHEN** an operator drags a member account card onto a persisted group in the Accounts page sidebar
- **THEN** the page persists the membership update
- **AND** the dragged account appears under the destination group
- **AND** the account is removed from its previous persisted group automatically

#### Scenario: Move an account card into the ungrouped bucket

- **WHEN** an operator drags a member account card onto the synthetic `Ungrouped` bucket in the Accounts page sidebar
- **THEN** the page removes the account from its persisted group
- **AND** the account becomes visible under `Ungrouped`

#### Scenario: Show drop-target feedback while dragging

- **WHEN** an operator drags a member account card across the Accounts page sidebar
- **THEN** the hovered group target renders a visible drop affordance
- **AND** the page clears that affordance after the drag ends or the drop completes
