---
title: "How to Connect Power Query to a Website That Requires a Login"
description: "Power Query's From Web connector struggles with login pages. Here's what works, what doesn't, and why: Basic auth, API keys, cookies, Organizational accounts, and the alternatives."
keywords: [power query login website, power query authentication, excel get data from web login, power query cookie, power query api key]
---

# How to Connect Power Query to a Website That Requires a Login

You want Excel to pull data from a website. The data sits behind a login. You go to **Data → Get Data → From Web**, paste the URL, and get the login page's HTML, an "Access to the resource is forbidden" error, or nothing at all.

This question comes up constantly in Excel forums and rarely gets a clear answer, because **the right approach depends on how the site authenticates.** This guide walks through each case.


> 💡 **Want to practise as you read?** Open a free live spreadsheet on [Excelio](https://excelio.com/learn-excel) and try every step yourself.

---

## First, understand the limitation

Power Query is **not a browser**. It doesn't:

- fill in login forms or click "Sign in" buttons,
- run JavaScript,
- handle captchas or multi-factor prompts (except through specific Microsoft sign-in flows),
- keep a session the way your browser does.

So "log in like a human and then scrape the page" isn't something Power Query does. You need to find a way to send credentials **in the request itself**. Here are your options, from most to least reliable.

---

## Option 1: Use the site's API (the best choice when it exists)

Many sites that show data behind a login also offer an **API**, often under "Developers," "Integrations," or "API keys" in your account settings. APIs are made for this kind of access and return clean JSON instead of HTML.

### API key in a header

```powerquery
let
    Source = Json.Document(
        Web.Contents(
            "https://api.example.com",
            [
                RelativePath = "v1/reports/sales",
                Query = [from = "2026-01-01"],
                Headers = [#"X-API-Key" = "YOUR_API_KEY"]
            ]
        )
    ),
    Data = Table.FromRecords(Source[data])
in
    Data
```

### Bearer token

```powerquery
Headers = [Authorization = "Bearer YOUR_TOKEN"]
```

Paste this into **Data → Get Data → From Other Sources → Blank Query → Advanced Editor**.

**Why `RelativePath` and `Query`?** Keeping the base URL fixed and putting the variable parts in `RelativePath`/`Query` lets Power Query (and the Power BI Service, if you publish) recognise the data source correctly and refresh it.

When prompted for credentials, choose **Anonymous**, because the key is already in the header.

> **Security:** An API key written into a query is visible to anyone who opens the workbook. Keep it in a separate cell or parameter, don't share the file, and use a read-only key where possible.

---

## Option 2: Basic authentication

Some older or internal sites (intranet reports, some device dashboards) use **HTTP Basic authentication**. Your browser shows a small pop-up asking for a username and password, not a styled login page.

That's easy:

1. **Data → Get Data → From Web**, and paste the URL.
2. When the credentials dialog appears, choose **Basic** on the left.
3. Enter your username and password.

Power Query stores the credentials in **Data Source Settings** and reuses them on refresh.

---

## Option 3: Windows or Organizational account

- **Windows:** For intranet sites that use your network login (SharePoint on-premises, internal IIS sites). Choose **Windows** in the credentials dialog.
- **Organizational account:** For Microsoft 365 services: SharePoint Online, OneDrive for Business, Dynamics, and some Azure-hosted apps. Choose **Organizational account → Sign in**. This *does* support your normal Microsoft sign-in, including MFA.

If the data is in SharePoint or OneDrive, use the dedicated **SharePoint Folder** or **SharePoint Online List** connector instead of From Web.

---

## Option 4: Reuse your browser's session cookie (a workaround)

For sites with a normal login form and no API, you can sometimes log in through your browser, copy the **session cookie**, and send it with the Power Query request.

1. Log in to the site in Chrome or Edge.
2. Press **F12** → **Network** tab, then reload the page.
3. Click the request for the page or data you want and find **Request Headers → Cookie**.
4. Copy the cookie value.
5. Use it in Power Query:

```powerquery
let
    Source = Web.Contents(
        "https://portal.example.com",
        [
            RelativePath = "reports/export",
            Headers = [Cookie = "sessionid=abc123...; other=..."]
        ]
    ),
    Html = Text.FromBinary(Source)
in
    Html
```

**Tip:** In the Network tab, look for a request that returns **JSON** or a **CSV download** (often under "Fetch/XHR"). Pointing Power Query at that URL gives you clean data instead of HTML you have to parse.

### Limitations

- **Session cookies expire**, often within hours or days. When the refresh breaks, copy a fresh cookie.
- It doesn't work on sites that use extra protections (CSRF tokens, device fingerprinting, short-lived tokens).
- **Check the site's terms of service.** Automated access to a portal may not be allowed even if you have an account.

---

## Option 5: Post the login form directly (advanced, fragile)

In theory you can send a `POST` with your username and password using the `Content` option of `Web.Contents`, read the cookie from the response, and use it in a second request. In practice Power Query doesn't give you access to response cookies, and most modern login pages use tokens and redirects. **For most sites this won't work**, and it's not worth the time.

---

## Option 6: When Power Query isn't the right tool

If none of the above works, use one of these instead:

| Tool | When to use it |
|---|---|
| **Scheduled export** | Many portals can email a daily CSV or save it to OneDrive/SharePoint. Point Power Query at that file. This is often the simplest and most reliable option. |
| **Power Automate** | Logs in with a connector or a desktop flow, downloads the file, and saves it where Excel can reach it. |
| **Python / Selenium / Playwright** | A script that drives a real browser, handles the login, and saves the data to a file for Excel. |
| **Power BI dataflows / gateway** | For enterprise sources that need a gateway for scheduled refresh. |

---

## Troubleshooting

**"We couldn't authenticate with the credentials provided."**
Clear old credentials: **Data → Get Data → Data Source Settings**, select the URL, choose **Clear Permissions**, and try again.

**You get the login page's HTML instead of data.**
The site is redirecting you because the request isn't authenticated. You need an API, Basic auth, or a cookie (Options 1–4).

**It works in the editor but fails on refresh.**
The credential type stored in Data Source Settings may be wrong (for example *Anonymous* when the site needs *Basic*). Edit the permission and set the right type.

**"Web.Contents failed to get contents... (401)" or "(403)."**
401 means the credentials are missing or wrong. 403 means the credentials are recognised but you don't have access, or the site blocks automated clients.

---

## Summary

1. **Look for an API first.** It's the most reliable option.
2. If the browser shows a **pop-up** login, use **Basic**.
3. If it's **Microsoft 365**, use **Organizational account** or the SharePoint connector.
4. If it's a normal **login form**, try the **cookie workaround** and expect to refresh the cookie.
5. If none of that works, **automate an export** and point Power Query at the file.

---

## Get comfortable with Power Query and Excel data skills

**Excelio** teaches Excel step by step in a live spreadsheet, from formulas to cleaning and importing data, with instant feedback.

👉 **[Start learning free on Excelio](https://excelio.com/learn-excel)**
