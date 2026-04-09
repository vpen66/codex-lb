# Why

The usage refresh loop currently leaves accounts `active` when the upstream usage API returns HTTP 401 even if the error message explicitly says the OpenAI account has been deactivated. That causes the dashboard to keep showing the account as active and the scheduler to keep retrying a permanently dead account.

# What Changes

- treat usage-refresh HTTP 401 responses as permanent deactivation signals only when the upstream error text explicitly indicates the account is deactivated
- persist the account status as `deactivated` with the upstream reason
- skip future background usage refresh requests for accounts already marked `deactivated`

# Impact

- deactivated accounts stop generating repeated failing usage calls
- transient 401 auth failures that do not mention deactivation continue to retry as before
- dashboard account status stays aligned with the upstream account state
