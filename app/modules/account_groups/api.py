from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth.dependencies import set_dashboard_error_format, validate_dashboard_session
from app.core.exceptions import DashboardBadRequestError, DashboardConflictError, DashboardNotFoundError
from app.dependencies import AccountGroupsContext, get_account_groups_context
from app.modules.account_groups.repository import AccountGroupNameConflictError
from app.modules.account_groups.schemas import (
    AccountGroupDeleteResponse,
    AccountGroupResponse,
    AccountGroupsResponse,
    AccountGroupUpsertRequest,
)
from app.modules.account_groups.service import AccountGroupAccountsMissingError

router = APIRouter(
    prefix="/api/account-groups",
    tags=["dashboard"],
    dependencies=[Depends(validate_dashboard_session), Depends(set_dashboard_error_format)],
)


@router.get("", response_model=AccountGroupsResponse)
async def list_account_groups(
    context: AccountGroupsContext = Depends(get_account_groups_context),
) -> AccountGroupsResponse:
    return AccountGroupsResponse(groups=await context.service.list_groups())


@router.post("", response_model=AccountGroupResponse)
async def create_account_group(
    payload: AccountGroupUpsertRequest,
    context: AccountGroupsContext = Depends(get_account_groups_context),
) -> AccountGroupResponse:
    try:
        return await context.service.create_group(name=payload.name, account_ids=payload.account_ids)
    except ValueError as exc:
        raise DashboardBadRequestError(str(exc), code="account_group_invalid") from exc
    except AccountGroupAccountsMissingError as exc:
        raise DashboardBadRequestError(str(exc), code="account_group_accounts_missing") from exc
    except AccountGroupNameConflictError as exc:
        raise DashboardConflictError("Account group name already exists", code="account_group_name_conflict") from exc


@router.put("/{group_id}", response_model=AccountGroupResponse)
async def update_account_group(
    group_id: str,
    payload: AccountGroupUpsertRequest,
    context: AccountGroupsContext = Depends(get_account_groups_context),
) -> AccountGroupResponse:
    try:
        group = await context.service.update_group(
            group_id=group_id,
            name=payload.name,
            account_ids=payload.account_ids,
        )
    except ValueError as exc:
        raise DashboardBadRequestError(str(exc), code="account_group_invalid") from exc
    except AccountGroupAccountsMissingError as exc:
        raise DashboardBadRequestError(str(exc), code="account_group_accounts_missing") from exc
    except AccountGroupNameConflictError as exc:
        raise DashboardConflictError("Account group name already exists", code="account_group_name_conflict") from exc
    if group is None:
        raise DashboardNotFoundError("Account group not found", code="account_group_not_found")
    return group


@router.delete("/{group_id}", response_model=AccountGroupDeleteResponse)
async def delete_account_group(
    group_id: str,
    context: AccountGroupsContext = Depends(get_account_groups_context),
) -> AccountGroupDeleteResponse:
    deleted = await context.service.delete_group(group_id)
    if not deleted:
        raise DashboardNotFoundError("Account group not found", code="account_group_not_found")
    return AccountGroupDeleteResponse(status="deleted")
