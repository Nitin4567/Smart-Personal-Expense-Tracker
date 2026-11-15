# Smart Expense Tracker

A free, mobile-first personal finance web app. Records income and expenses, auto-categorizes spending from the note you type, tracks a monthly budget, and generates reports with charts. No backend, no login, no cost.

## Features
- Add expenses and income in a few taps
- **Smart categorization**: type "Zomato dinner" and it picks Food (you can override)
- Monthly budget with a progress bar (turns amber at 80%, red when over)
- Reports: income, expenses and savings, spending by category (doughnut chart), last 6 months (bar chart), plus a plain-language insight
- Search and filter history, delete entries
- Download all data as CSV
- Works offline after first load (charts need internet once to load Chart.js)
- Light and dark mode follow your phone
- Data stays in your browser (localStorage)

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Styling |
| `app.js` | All logic: storage, categorizer, reports |
| `README.md` | This file |

## Put it online free (GitHub Pages)
1. Create a new public repository, e.g. `expense-tracker`.
2. Add the four files above at the top level (not inside a folder).
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
5. After about a minute your app is live at `https://YOUR-USERNAME.github.io/expense-tracker/`.

Tip: open the link in Chrome on your phone and use **Add to Home screen** to use it like an app.

## Customize
- Categories and their keywords are at the top of `app.js` (`CATS`). Add words you use often.
- Colors are variables at the top of `style.css`.

## Notes
Data lives only in the browser it was entered in. Clearing site data or switching phones loses it, so use **Download CSV** now and then as a backup.

## Ideas to extend
Edit transactions, recurring expenses, JSON import, PWA install support, cloud sync.
